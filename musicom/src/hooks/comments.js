import { useToast } from "@chakra-ui/react";
import { uuidv4 } from "@firebase/util";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "lib/firebase";
import { DASHBOARD } from "lib/routes";
import { useEffect, useState } from "react";
import { useCollectionData } from "react-firebase-hooks/firestore";
import { useNavigate } from "react-router-dom";

export default function useAddComment({ postID, uid }) {
  const [isLoading, setLoading] = useState(false);
  const toast = useToast();

  async function addComment(text) {
    setLoading(true);
    const id = uuidv4();
    const date = Date.now();
    const docRef = doc(db, "comments", id);
    await setDoc(docRef, { text, id, postID, date, uid });

    toast({
      title: "Comment added!",
      status: "success",
      isClosable: true,
      position: "top",
      duration: 5000,
    });
    setLoading(false);
  }

  return { addComment, isLoading };
}

export function useComments(postID) {
  const [comments, setComments] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (postID) {
      const q = query(
        collection(db, "comments"),
        where("postID", "==", postID),
        orderBy("date", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const commentsData = snapshot.docs.map((doc) => doc.data());
          setComments(commentsData);
          setLoading(false);
        },
        (error) => {
          setError(error);
          setLoading(false);
        }
      );

      return unsubscribe;
    }
    return;
  }, [postID]);

  return { comments: comments, isLoading: isLoading, error: error };
}

export function useDeleteComment(id) {
  const [isLoading, setLoading] = useState(false);
  const toast = useToast();

  async function deleteComment() {
    const res = window.confirm("Are you sure you want to delete this comment?");

    if (res) {
      setLoading(true);
      const docRef = doc(db, "comments", id);
      await deleteDoc(docRef);
      toast({
        title: "Comment deleted!",
        status: "info",
        isClosable: true,
        position: "top",
        duration: 5000,
      });
      setLoading(false);
    }
  }

  return { deleteComment, isLoading };
}
