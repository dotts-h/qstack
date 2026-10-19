---
name: principle-test-behavior-not-implementation
description: "Apply when you write, change, or keep a test. Assert what the code's users can observe, so that the test fails when that behavior breaks and keeps passing when only the internals change."
disable-model-invocation: true
---

# Test behavior, not implementation

A test is a claim about what the code does for its users. A user may be a caller, an end user, or another service. Behavior is what those users can observe through the interface they use. Observable results include return values, errors, and state a user can read back. Observable results also include effects on systems outside the code, such as a request sent, a row written, or a message emitted. Implementation is what users cannot observe. That means private helpers, internal call order, intermediate data, and which internal collaborator did the work.

Judge each test against two imagined edits.

- **Break the behavior.** Make the code return a wrong value, skip an effect, or do the effect twice. If the test still passes, it proves nothing. These are the usual causes. An assertion is looser than the contract. An expected value is computed by the code under test. A restated constant or prompt string never runs the code that reads it. An assertion checks data that the test built itself.
- **Change the internals.** Keep every observable result the same and restructure the code underneath. If the test now fails, it is pinned to the implementation. It will need a rewrite on every refactor and still catches no bug.

Keep a test that catches the first edit and survives the second. Rewrite or delete the rest. To write a test that does both, drive the code through its users' interface with a concrete input. Derive the expected value from the requirement, not from a run of the code. Assert what the contract promises, no less and no more.

The contract decides, not the shape of the assertion. When "an empty cart never charges" is the promise, an assertion that the payment client got no call is behavior. Pair that assertion with a case where the charge happens, so the test shows it can see a call. The payload that a mocked external service receives is behavior, because that service observes it. A call to an internal helper is implementation, because no user can see it. An empty list is the exact answer when no record matches. An empty list is a hollow check when the test only needs some result. An exact error message pins wording that no caller reads. The error type that callers branch on is the contract.

A test can pin an invariant instead of a call. A key that must exist in two tables is one invariant. A compile-time type check is another. The invariant is the behavior.
