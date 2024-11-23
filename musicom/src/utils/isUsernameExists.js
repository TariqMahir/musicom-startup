import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "lib/firebase";

export default async function isUsernameExists(username) {
  const q = query(collection(db, "users"), where("username", "==", username));
  const businessQ = query(
    collection(db, "businesses"),
    where("username", "==", username)
  );
  const querySnapshot = await getDocs(q);
  const businessQuerySnapshot = await getDocs(businessQ);
  const exists = querySnapshot.size > 0 || businessQuerySnapshot.size > 0;
  if (exists) {
    // Generate a few potential alternatives
    const alternatives = Array.from(
      { length: 5 },
      (_, i) => `${username}${i + 1}`
    );
    return { exists: true, alternatives };
  } else {
    return { exists: false };
  }
}

export async function isEmailExists(email) {
  const q = query(collection(db, "users"), where("email", "==", email));
  const querySnapshot = await getDocs(q);
  const exists = querySnapshot.size > 0;

  if (exists) {
    return { exists: true };
  } else {
    return { exists: false };
  }
}
