import { useState } from "react";
import { firestore } from "lib/firebase";
import { collection, addDoc } from "@firebase/firestore";
import { Timestamp } from "@firebase/firestore";

// A hook to manage notifications.
export function useNotifications() {
  const [isLoading, setIsLoading] = useState(false);

  // Function to add a notification to the database.
  const sendNotification = async ({
    title,
    content,
    uid,
    type,
    from,
    time,
  }) => {
    setIsLoading(true);

    try {
      const notificationsRef = collection(firestore, "notifications");

      const newNotification = {
        title,
        content,
        uid,
        type,
        from,
        time,
      };

      const docRef = await addDoc(notificationsRef, newNotification);
      const notificationId = docRef.id; // Get the ID of the newly added document

      setIsLoading(false);
    } catch (error) {
      console.error("Error sending notification:", error);
      setIsLoading(false);
    }
  };

  return { isLoading, sendNotification };
}
