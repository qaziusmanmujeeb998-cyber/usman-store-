# Security Specification for Asan Store

## 1. Data Invariants
- A Product must have a positive `buyPrice`, `sellPrice`, and `stockQuantity`.
- A Sale must have a `totalAmount` equal to the sum of its items' prices.
- Only Admins can modify User roles or Branch information.
- Cashiers can only create Sales and view Products/Customers.
- Users can only access data if they are authenticated and their `branchId` matches (for multi-branch support).
- `createdAt` and `ownerId` (if applicable) are immutable.

## 2. The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create a sale with a different `cashierId`.
2. **Privilege Escalation**: A Cashier trying to update their own `role` to 'Admin' in the `users` collection.
3. **Price Manipulation**: An unauthorized user trying to update a product's `sellPrice`.
4. **Invalid Schema**: Creating a product with a negative `stockQuantity`.
5. **ID Poisoning**: Using a 2KB string as a document ID for a new product.
6. **Bypassing Invariants**: Creating a sale without a `timestamp`.
7. **Cross-Branch Access**: A Cashier from Branch A trying to list sales from Branch B.
8. **Field Injection**: Adding an `isAdmin` boolean to a user profile by a non-admin.
9. **Terminal State Break**: Trying to update a sale record after it has been finalized.
10. **Orphaned Record**: Creating a product with a `categoryId` that doesn't exist.
11. **PII Leak**: An unauthenticated user trying to read the `customers` collection.
12. **Denial of Wallet**: Sending 100 requests to create products with 1MB strings in the `name` field.

## 3. The Test Runner

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "asan-store-test",
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test("Unauthorized users cannot read products", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "products/p1")));
});

test("Cashiers cannot change product prices", async () => {
  const db = testEnv.authenticatedContext("cashier1", { role: "Cashier" }).firestore();
  await assertFails(updateDoc(doc(db, "products/p1"), { sellPrice: 10 }));
});

// ... more tests for the Dirty Dozen
```
