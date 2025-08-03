---
title: Arbitrary Stateful Aggregation with Spark
subtitle: Exploring flatMapGroupsWithState for advanced streaming use cases beyond built-in aggregations
date: 2025-05-03
---

Apache Spark Structured Streaming provides high-level APIs for streaming aggregations, windowing, and joins. However, many real-world scenarios demand maintaining state across streaming data beyond what built-in aggregations offer. Stateful operations allow you to remember information from past events and update it as new data arrives — enabling complex session tracking, alerting on patterns over time, and custom aggregations that evolve with the stream.

For example, you might need to emit an alert if events of a certain type exceed a threshold over time, or maintain user sessions across indefinite periods. Such logic goes beyond simple windowed counts and requires remembering arbitrary data across micro-batches.

Spark addresses these use cases with stateful transformation APIs: namely `mapGroupsWithState` and the more powerful `flatMapGroupsWithState`. These allow user-defined state management on grouped streams. In essence, you define a state for each key (group) and a function to update state for each new chunk of data per key. Spark will handle calling your function on each micro-batch, passing in new data and the saved state, and persisting the state across batches with fault-tolerance via checkpointing.

In the following sections, we'll focus on `flatMapGroupsWithState` – exploring how it works under the hood, its capabilities, and when to prefer it over alternatives like `mapGroupsWithState` or older DStream operations like `reduceByKeyAndWindow`.

## Arbitrary Stateful Aggregation with `flatMapGroupsWithState`

`flatMapGroupsWithState` enables arbitrary stateful aggregation on a streaming Dataset by letting you manage state per key and emit an arbitrary number of output records for each key. Conceptually, you first group the streaming Dataset by a key, then apply `flatMapGroupsWithState` with a user-defined function of type `(Key, Iterator[Values], GroupState[S]) => Iterator[U]`, where `S` is your custom state type and `U` is the output type.

Spark calls this function for each key that has new data in the current micro-batch (or for keys that have timed out, as discussed later), and gives you: the key, an iterator of new values for that key, and a `GroupState[S]` object to read/update the current state. You can then update or remove state and output zero, one, or many results per key.

This flexibility is what distinguishes `flatMapGroupsWithState` from its sibling. In fact, the key difference is:

- `mapGroupsWithState`: Your function returns exactly one output value per group (key) each time it's called.
- `flatMapGroupsWithState`: Your function returns zero, one, or multiple output values per group. This means you can choose to emit nothing for a key in a given batch, or emit several records if your logic dictates.

As the Spark documentation notes, `mapGroupsWithState` returns one record per group, whereas `flatMapGroupsWithState` allows the function to return any number of records (including no records). This makes `flatMapGroupsWithState` suitable for more complex stream processing: e.g. waiting for certain conditions to emit an output, emitting intermediate results, or splitting one group's state into multiple output events.

Under the hood, Spark's micro-batch engine handles `flatMapGroupsWithState` by maintaining a state store (backed by durable storage) that maps each key to its state. On each trigger:

1. Spark groups new incoming records by key (shuffling data so that same keys go to the same partition) and then calls your state-update function for each key that has data in this batch. The `Iterator[Values]` contains all new events for that key in the batch (note: the iterator is not guaranteed to be in event-time order, so your function should sort or handle ordering if needed).

2. Inside your function, you use the `GroupState[S]` interface to interact with the state: `get` or `getOption` to retrieve the previous state, `update(newState)` to set a new state, and optionally `remove()` to delete the state. You can also set a timeout timestamp or duration for the state via `GroupState.setTimeout...` methods.

3. Your function returns an `Iterator[U]` of output records for that key. Spark collects these outputs across all keys.

4. After processing all new data, if you have enabled timeouts, Spark will also invoke your function for any keys whose state has timed out (expiration reached with no new data). In that case, the iterator of new values will be empty and `state.hasTimedOut` will return true within your function. This is an opportunity to output final results for expired state or clean it up. Spark's execution ensures that timeouts are handled after processing new data for the batch, so you can update timeout deadlines before they are checked.

5. The state store is then updated with any new state values for each key and persisted (to checkpoint files). If you called `state.remove()`, the state for that key is dropped from the store.

One important aspect is that Spark only invokes your function for keys that are active in a batch (i.e., keys with new data, or keys whose timeout expired). Keys with existing state but no new events won't be processed until either they receive new data or their timeout occurs. This behavior means you can have long-lived state that doesn't incur processing cost every batch unless it changes or expires.

## State Timeouts and Expiration

Managing state growth is crucial in long-running streams. `GroupStateTimeout` lets you specify either processing time or event time timeouts for state. With a timeout configured, you must call `state.setTimeoutDuration(...)` (for processing time) or `state.setTimeoutTimestamp(...)` (for event time) within your function to schedule an expiration.

For example, you might set a session state to timeout after 30 minutes of inactivity. When the timeout is reached, Spark will call your function one more time for that key with `state.hasTimedOut == true` and no new values, so you can handle the expired state (e.g. emit a closing event or simply remove the state).

**Processing time timeout**: Based on real clock time. If you set a timeout of X milliseconds, Spark guarantees the timeout won't occur before X ms has elapsed, and will occur eventually after X ms once a trigger occurs. In other words, there's no strict upper bound (if no batch is triggered, the call waits), but as soon as the next micro-batch happens after X ms, the timeout will be processed. (If the stream has no new data, you may need to use a scheduled trigger to ensure batches still occur so timeouts can fire.)

**Event time timeout**: Based on watermark progression. You must define a watermark on the event-time column in your stream for Spark to know when an event is "late". When you call `setTimeoutTimestamp(timestamp)`, Spark will mark the state to expire when the event-time watermark exceeds that given timestamp. All events older than the current watermark are filtered out; once the watermark passes your set timeout timestamp, Spark triggers the timeout. This allows state to expire in sync with event-time (useful for session windows, etc.). Spark will error if you set an event-time timeout timestamp earlier than the current watermark, so typically you use the current watermark (accessible via `state.getCurrentWatermarkMs()`) plus some offset.

**State removal**: It's important to note that timing out a state via the API does not automatically drop it from storage. Your function needs to explicitly call `state.remove()` to delete state when you no longer need it (for example, after emitting a final result for that key). If you don't remove it, Spark will stop giving it to your function (it's considered expired) but it will remain in the checkpointed state store as garbage. This can bloat the state store over time. Best practice is to call `remove()` for any state that has finished its lifecycle (often in the branch `if (state.hasTimedOut)` or when some end condition is reached) to prevent unbounded accumulation of obsolete state.

## When to Use `flatMapGroupsWithState` vs. Alternatives

Spark offers a few approaches to stateful streaming, and choosing the right one depends on your use case:

- **Built-in aggregations and windows**: If your problem can be expressed as a standard aggregation (sum, count, etc.) over a fixed window or the entire stream, prefer using Spark's built-in operations (like `groupBy().agg(...)` with a time window). For example, the older Spark Streaming had `reduceByKeyAndWindow` for windowed reductions; in Structured Streaming, the equivalent is using a time-based window grouped by key. This is simpler and optimized internally. Use custom stateful processing only when such high-level transforms aren't sufficient (e.g., when you need custom update logic or non-time-bounded state). In fact, "reduceByKeyAndWindow" doesn't exist in Structured Streaming – you'd achieve it with a windowed aggregation in a query.

- **`mapGroupsWithState`**: Use this when you need to update state per key and produce exactly one output per key on each update. It's a slightly simpler API than flatMap. For example, if you are maintaining a running count or average per user and want to output the updated value each time, `mapGroupsWithState` fits well. Internally it's similar to flatMap but enforces a one-to-one correspondence between state updates and output rows. You cannot skip or emit extra results with `mapGroupsWithState`. Trying to implement complex logic that needs variable outputs using this API can be awkward or impossible.

- **`flatMapGroupsWithState`**: Use this for arbitrary stateful logic where the number of outputs per key per update may vary or be zero. It is ideal for event-driven outputs (e.g., generating an alert only when a condition is met, otherwise emitting nothing) and for scenarios like sessionization where you might emit a session summary only after a period of inactivity. It's also needed when one input event might result in multiple output events. In general, if `mapGroupsWithState` is too restrictive for your use case, `flatMapGroupsWithState` is the go-to. (Under the hood they share the same state mechanism; flatMap just generalizes the output.) Keep in mind that with flatMap you must specify an output mode (Append or Update) when calling it – Append is common for use cases like emitting new events (e.g. session ended events), whereas Update mode can be used if you treat the output as continually updated results.

- **Legacy DStream operations** (`updateStateByKey`, etc.): These belong to the older Spark Streaming (RDD-based) API. If you are using Structured Streaming (DataFrame/Dataset API), you should use the newer `mapGroupsWithState/flatMapGroupsWithState`. They integrate with Structured Streaming's engine (watermarks, output modes, Catalyst optimization, etc.) and are type-safe in Scala/Java. Only fall back to DStreams if you are maintaining legacy code.

In summary, prefer high-level aggregations or windows when possible; use `mapGroupsWithState` for straightforward per-key stateful mapping; and use `flatMapGroupsWithState` when you need full control over state and outputs. Next, we will demonstrate how `flatMapGroupsWithState` works through code examples.

## Basic Example: Running Count per Key

To illustrate the usage of `flatMapGroupsWithState`, let's start with a simple aggregation example. Suppose we have a stream of events each containing a `userId` and a numerical `value`, and we want to maintain a running count of events per user (a simple running count). We could do this with built-in aggregations, but we'll show a custom approach for learning purposes. Each batch, we'll output the updated total count for any user who had new events.

```scala
import org.apache.spark.sql.streaming.{GroupState, GroupStateTimeout, OutputMode}

// Case classes for input and output
case class UserEvent(userId: String, value: Double)
case class UserCount(userId: String, totalCount: Long)

// Our state will be just a Long representing the count so far
// We start from 0 for new users.
def updateCountPerUser(
    user: String,
    events: Iterator[UserEvent],
    state: GroupState[Long]): Iterator[UserCount] = {
  
  // Get current count from state or initialize to 0
  val currentCount = state.getOption.getOrElse(0L)
  
  // Sum up the number of new events in this batch for the user
  val newEvents = events.toSeq                  // materialize iterator
  val batchCount = newEvents.size.toLong
  
  // Update state with new total count
  val newTotal = currentCount + batchCount
  state.update(newTotal)                        // persist updated count
  
  // Emit one output: the updated total count for this user
  Iterator(UserCount(user, newTotal))
}

// Apply the logic in your streaming query
val userEventsStream: Dataset[UserEvent] = ...  // Your streaming source

val userCounts = userEventsStream
  .groupByKey(_.userId)
  .flatMapGroupsWithState[Long, UserCount](
    outputMode = OutputMode.Update(),
    timeoutConf = GroupStateTimeout.NoTimeout()
  )(updateCountPerUser)

userCounts.writeStream
  .format("console")
  .outputMode("update")
  .start()
```

In this basic example, the state (`Long`) holds the running count of events for each user. The function `updateCountPerUser` retrieves the previous count (starting from 0 if none), adds the count of new events (`batchCount`), updates the state, and returns a single `UserCount` output.

We chose `OutputMode.Update()` because we are conceptually updating a result (the total count) on each trigger. In Update mode, the streaming sink will treat each output as an updated value for the result table (meaning if using a supported sink like memory or console, you'll see the latest count for each user). We could also use Append mode here – it would produce a new row for each update (which in this case would just duplicate counts over time). Update mode is more semantically fitting for continuously updated aggregates.

Notice a few things: we call `groupByKey(_.userId)` to group events by user, and then call `flatMapGroupsWithState` with our function. We specified `GroupStateTimeout.NoTimeout()` because we have no expiration logic in this simple scenario – we want to keep counting indefinitely. If a user stops appearing, their state will remain (with the last count) but our function won't be called for that user again unless new data comes (since we didn't set a timeout). If unbounded state growth is a concern (e.g., many users), we could consider a timeout to eventually drop inactive users, which we'll see in the next example.

## Advanced Example: Initial State and Conditional Output Logic

Now let's explore a more advanced use case that leverages Spark's `ProcessingTimeTimeout` feature to detect inactivity. Instead of aggregating numeric metrics like simple count, we'll shift focus to monitoring service health via logs.

### Context: Log-Based Service Monitoring

Imagine a platform where services continuously send log events. We want to monitor these logs to detect if a service becomes inactive — i.e., it stops sending logs for more than 5 minutes. When this happens, we should emit an alert for the service (`Alert(serviceId, "stale")`). If the service resumes activity (sends a new log after being inactive), we emit a recovery message (`Alert(serviceId, "ok")`).

This scenario is ideal for `flatMapGroupsWithState` combined with a timeout configuration, which allows Spark to trigger logic even when no new data arrives.

### Defining the Input and Output

We'll assume the log stream consists of the following structure:

```scala
case class LogEvent(service: String, timestamp: java.sql.Timestamp)
case class Alert(service: String, status: String)  // "stale" or "ok"
```

We track each service independently, maintaining a simple `Boolean` state indicating whether we've already emitted a "stale" alert. We'll use a 5-minute timeout.

We can also initialize some services with a known state using an initial dataset, which is useful if you already know that certain services were inactive before the stream starts:

```scala
val initialState: Dataset[(String, Boolean)] = Seq(
  ("service-a", false),
  ("service-b", true) // already marked as stale
).toDS()
  .groupByKey(_._1)
  .mapValues(_._2)
```

### The Update Function

Here's the corrected function that uses logs and ensures timeout is managed properly:

```scala
def updateStateWithTimeout(
    service: String,
    logs: Iterator[LogEvent],
    state: GroupState[Boolean]): Iterator[Alert] = {
  
  if (state.hasTimedOut) {
    // Timeout fired, check if we've already emitted a stale alert
    if (!state.exists || !state.get) {
      // State exists and we have not yet marked it as stale
      state.update(true)
      Iterator(Alert(service, "stale"))
    } else {
      // Already marked as stale, no need to emit again
      Iterator.empty
    }
  } else if (logs.nonEmpty) {
    // We received new log entries for this service
    if (state.exists && state.get) {
      // Service was previously marked as stale, emit recovery alert
      state.update(false)
      state.setTimeoutDuration("5 minutes")
      Iterator(Alert(service, "ok"))
    } else {
      // Service is active and healthy, just refresh timeout
      state.update(false)
      state.setTimeoutDuration("5 minutes")
      Iterator.empty
    }
  } else {
    // No new logs and no timeout (shouldn't happen in this setup)
    Iterator.empty
  }
}
```

### Applying the Logic in Spark

We apply this logic with `flatMapGroupsWithState`, using `ProcessingTimeTimeout` to detect inactivity periods. If using initial state, we pass it via `mapGroupsWithState` setup:

```scala
val logsStream: Dataset[LogEvent] = ...  // Your streaming source

val alerts = logsStream
  .withWatermark("timestamp", "10 minutes")
  .groupByKey(_.service)
  .flatMapGroupsWithState[Boolean, Alert](
    outputMode = OutputMode.Append(),
    timeoutConf = GroupStateTimeout.ProcessingTimeTimeout()
  )(updateStateWithTimeout)

alerts.writeStream
  .format("console")
  .outputMode("append")
  .start()
```

Unlike regular aggregations, this approach emits output even when no input arrives, thanks to `ProcessingTimeTimeout`. That's what enables stale detection.

We could also improve this to continuously emit alerts — like every 5 minutes for inactive services — but the idea here is to walk through each Spark feature and let the full logic be up to you. 🙂

## Performance Considerations and Limitations

While `flatMapGroupsWithState` is extremely powerful, it's important to design and tune stateful streaming applications carefully for performance and correctness:

- **State Size and Memory Pressure**: The state for each key is kept in memory on the executors (with periodic backup to disk). If you maintain millions of keys or very large state objects, this can strain the JVM. Spark's default state store implementation (HDFS backed) keeps data in memory maps, which can lead to large GC pauses when state grows. To mitigate this, ensure you have adequate executor memory and consider using the RocksDB state store introduced in Spark 3.2. RocksDB state store keeps state in native memory and disk via a RocksDB database, significantly reducing JVM heap usage for state. You can enable it by setting `spark.sql.streaming.stateStore.providerClass` to `RocksDBStateStoreProvider`. This is beneficial for heavy state workloads, though it may introduce a slight overhead per operation – always measure in your environment.

- **State Timeout and Cleanup**: As discussed, always use state timeout or explicit removal to prevent infinite accumulation of state. If your query runs forever and keys keep coming, without timeouts you will retain state for every key seen. Design a state eviction strategy: for example, use `GroupStateTimeout.ProcessingTimeTimeout` to drop state that hasn't seen new data in X hours, or `EventTimeTimeout` to drop state after a period of event-time inactivity (like end of session). In your function, when `state.hasTimedOut` is true, perform any final logic and call `state.remove()` to actually eliminate the state. Remember that Spark will not automatically delete timed-out state without the remove call – it only stops calling your function on it. If you forget to remove, the stale state stays in checkpoint files and can slow down recovery or increase storage usage.

- **Batch Processing Costs**: Each micro-batch, Spark invokes your state function for keys with new data. The cost grows with the number of keys and the complexity of your function. Batching of inputs per key (the iterator) helps amortize cost — e.g., if a key gets 100 events in a batch, Spark calls the function once with an iterator of 100 rather than 100 separate calls. Take advantage of that by processing the iterator in bulk. Also note the lack of ordering guarantee in the iterator – if order matters (e.g., you are computing session gaps), you may need to sort the batch of events by timestamp which adds overhead. If events are large, be mindful converting the iterator to a Seq (materializing it) might use memory; an alternative is to process the iterator in a single pass.

- **Skew and Partitioning**: The grouping key determines the partition of state. If your keys are highly skewed (some keys get the vast majority of events), then a single partition might become a hotspot, limiting throughput (because one executor core handles that key's state updates sequentially). Consider strategies to mitigate skew (if possible) or allocate more resources to that partition. Currently, you cannot have one key's state spread across multiple executors (state isn't subdivided further than the key grouping). Designing your key space to distribute load evenly will yield better performance.

- **Output Modes and Downstream Operations**: `flatMapGroupsWithState` supports Append and Update output modes (specified when calling it). In Append mode, outputs are treated as new rows added to the result table; in Update mode, outputs are seen as updates to existing rows. Append is often used when emitting event-like outputs (like our alert or session result scenarios), while Update is used for continuous aggregates. Be aware that the choice of output mode can affect what you can do after the stateful operation. For instance, Spark does not allow an aggregation after a `flatMapGroupsWithState` in Update mode (because it's not clear how to combine with further aggregation). If you need to perform another aggregation or join after your stateful function, you might have to use Append mode or restructure your query (sometimes splitting into multiple streaming queries). Also, you cannot have multiple stateful operators in the same query in Update mode (with some exceptions); if you need multiple stateful steps, the current guideline is to break them into separate queries, each with their own checkpoint.

- **Checkpointing and Fault Tolerance**: Stateful streaming queries must have checkpointing enabled to allow recovery after failures. The state for each micro-batch is saved as delta files under the checkpoint directory. Over time, these can grow. Spark periodically consolidates state (snapshotting) to avoid reading a long chain of deltas. Ensure your checkpoint location is on reliable storage (HDFS, S3, etc.) and monitor its size. If you notice the checkpoint directory growing very large, it might indicate you're not removing old state (causing unbounded growth), or simply that you have a lot of state — consider using RocksDB state backend which can mitigate size by compaction. Restoring a large state can also increase restart times, so keep state as compact as possible (prune unnecessary data, use efficient data structures for state).

- **Serialization and State Format**: The state `S` you define should be Serializable (Spark will serialize it for storage). Prefer using simple case classes or Scala/Java types for state. Complex or very large objects could slow serialization or use excessive memory.

- **Testing and Semantics**: Because `flatMapGroupsWithState` gives you a lot of control, ensure your function logic aligns with the semantics of the output mode and watermark. For example, if using event-time, make sure to set watermarks and timeouts correctly so that you don't hold state forever waiting for an event that will never come. In Update mode, avoid emitting "stale" results that go backwards in time (Spark expects that updates represent the latest state). When possible, write unit tests for your state update function (you can call it with sample inputs and simulated old state to verify the outputs and state transitions). Also test failure recovery by checkpointing and restarting the query to ensure state resumes correctly.

In summary, treat stateful streaming like you would a small stateful service: carefully manage memory, clean up resources (state) when done, and monitor performance. Spark's engine will do the heavy lifting of distribution and fault tolerance, but you provide the brains of the operation via your state update function.

## Conclusion

`flatMapGroupsWithState` is a powerful API in Apache Spark Structured Streaming that unlocks use cases beyond built-in aggregations. By maintaining arbitrary user-defined state across the stream, you can implement custom session handling, alerting, dynamic aggregations, and more – all with exactly-once guarantees and integration with Spark's streaming model.

We've seen how it works under the hood, how it compares to simpler alternatives, and walked through examples from a basic running count to a more advanced alerting scenario with initial state. With great power comes responsibility: careful consideration of state size, timeouts, and performance tuning is necessary to build a robust stateful streaming application.

## References

- [Apache Spark Structured Streaming Programming Guide — Arbitrary Stateful Operations](https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html)
- [Apache Spark Scaladoc — GroupState and flatMapGroupsWithState API details](https://spark.apache.org/docs/latest/api/java/org/apache/spark/sql/streaming/GroupState.html)
- [Databricks Blog — "Arbitrary Stateful Processing in Apache Spark's Structured Streaming"](https://www.databricks.com/blog/2017/10/17/arbitrary-stateful-processing-in-apache-sparks-structured-streaming.html)
- [Bartosz Konieczny, waitingforcode.com — Stateful Streaming State Lifecycle and Removal](https://www.waitingforcode.com/apache-spark-structured-streaming/state-lifecycle-management-structured-streaming/read)
