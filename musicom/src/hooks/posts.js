import { useToast } from "@chakra-ui/react";
import { v4 as uuidv4 } from "uuid";
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  list,
  uploadString,
} from "firebase/storage";
import { db, app } from "lib/firebase";
import { useEffect, useMemo, useState } from "react";
import {
  useCollectionData,
  useDocumentData,
} from "react-firebase-hooks/firestore";

// Initialize Firebase storage
import { storage } from "lib/firebase";
import { useAuth } from "./auth";
import { useLocation, useNavigate } from "react-router-dom";
import { DASHBOARD } from "lib/routes";

export function useAddPost() {
  const [isLoading, setLoading] = useState(false);
  const toast = useToast();
  const storageRef = ref(getStorage(), "files");
  const { user, isLoading: userLoading } = useAuth();

  async function addPost(post) {
    setLoading(true);
    const id = uuidv4();
    const { photos = [], videos = [], files = [], ...rest } = post;

    const [photoUrls, videoUrls, fileUrls] = await Promise.all([
      photos.length > 0 ? uploadFiles(photos, id, "photos") : [],
      videos.length > 0 ? uploadFiles(videos, id, "videos") : [],
      files.length > 0 ? uploadFiles(files, id, "files") : [],
    ]);

    const sanitizedPost = {
      ...rest,
      id,
      date: Date.now(),
      photos: photoUrls,
      videos: videoUrls,
      files: fileUrls,
      likes: [],
      reposts: [], // Initialize the reposts as an empty array
    };

    const sanitizedPostWithoutFiles = JSON.parse(
      JSON.stringify(sanitizedPost),
      (key, value) => {
        if (value instanceof File) {
          return undefined; // Remove custom File objects
        }
        return value;
      }
    );

    await setDoc(doc(db, "posts", id), sanitizedPostWithoutFiles);

    toast({
      title: "Post added successfully!",
      status: "success",
      isClosable: true,
      position: "top",
      duration: 5000,
    });

    setLoading(false);
  }

  async function uploadFiles(files, postId, fileType) {
    if (!files) return [];

    const urls = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file) continue;

      const id = uuidv4();
      const storageChildRef = ref(
        storageRef,
        `${user.id}/posts/${postId}/${fileType}/${file.name}`
      );
      const snapshot = await uploadBytes(storageChildRef, file);
      const url = await getDownloadURL(snapshot.ref);
      urls.push(url);
    }

    return urls;
  }

  return { addPost, isLoading };
}

export function useToggleLike({ id, isLiked, uid }) {
  const [isLoading, setLoading] = useState(false);

  async function toggleLike() {
    setLoading(true);
    const postRef = doc(db, "posts", id);

    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(uid),
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(uid),
        });
      }
    } catch (error) {
      console.log("Error toggling like:", error);
    }

    setLoading(false);
  }

  return { toggleLike, isLoading };
}

export function usePost(id) {
  const { user } = useAuth();
  const q = doc(db, "posts", id);
  const [post, isLoading] = useDocumentData(q);

  return { post, isLoading };
}

export function usePosts(uid = null) {
  const q = uid
    ? query(
        collection(db, "posts"),
        where("uid", "==", uid),
        orderBy("date", "desc")
      )
    : query(collection(db, "posts"), orderBy("date", "desc"));

  const [posts, isLoading, error] = useCollectionData(q);

  if (error) throw error;

  return { posts, isLoading };
}

export function useRepostPost() {
  const toast = useToast();
  const { user, isLoading: userLoading } = useAuth();

  async function repostPost(originalPost, repostUser) {
    if (!originalPost) return;

    try {
      const postRef = doc(db, "posts", originalPost.id);
      const postSnapshot = await getDoc(postRef);
      const postData = postSnapshot.data();

      const hasReposted = postData.reposts.find(
        (repost) => repost.uid === repostUser.id
      );

      if (hasReposted) {
        toast({
          title: "You've already reposted this post!",
          status: "warning",
          isClosable: true,
          position: "top",
          duration: 5000,
        });
        return; // exit early if the user has already reposted this post
      }

      const postId = uuidv4();
      const repostDate = Date.now();

      // Get the original post document
      const originalPostDocRef = doc(db, "posts", originalPost.id);
      const originalPostDoc = await getDoc(originalPostDocRef);

      if (!originalPostDoc.exists()) {
        throw new Error("Original post not found");
      }

      // Extract necessary fields from the original post
      const { text, photos, videos, files, likes, uid, reposts } =
        originalPostDoc.data();

      // Ensure photos, videos, and files fields are always defined
      const repostPhotos = photos || [];
      const repostVideos = videos || [];
      const repostFiles = files || [];

      // Get the username of the original post author
      const userDoc = await getDoc(doc(db, "users", uid));
      const username = userDoc.exists() ? userDoc.data().username : "";

      // Create the repost object
      const repost = {
        id: postId,
        uid: repostUser.id,
        date: repostDate,
        text,
        photos: repostPhotos,
        videos: repostVideos,
        files: repostFiles,
        likes: [],
        reposts: 0,
        originalPost: {
          id: originalPost.id,
          uid: originalPost.uid,
          date: originalPost.date,
          username: username,
        },
      };

      // Save the repost to the database
      await setDoc(doc(db, "posts", postId), repost);

      // Update the original post's reposts array

      await updateDoc(originalPostDocRef, {
        reposts: arrayUnion({
          id: postId,
          uid: user.id,
          username: user.username, // Assuming the user object has the username property
          date: repostDate,
        }),
      });

      toast({
        title: "Post reposted successfully!",
        status: "success",
        isClosable: true,
        position: "top",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Failed to repost the post.",
        description:
          "Either already reposted or there was an issue trying to repost.",
        status: "error",
        isClosable: true,
        position: "top",
        duration: 5000,
      });
    }
  }

  return { repostPost, isLoading: userLoading };
}

export function useDeletePost(id) {
  const [isLoading, setLoading] = useState(false);
  const toast = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  async function deletePost() {
    const res = window.confirm("Are you sure you want to delete this post?");

    if (res) {
      setLoading(true);

      // Get the current post data
      const postRef = doc(db, "posts", id);
      const postSnapshot = await getDoc(postRef);
      const postData = postSnapshot.data();
      const originalPost = postData.originalPost || null; // Get the originalPost object from postData

      // Delete the post document and all related reposts
      await deletePostAndReposts(postRef, originalPost);

      // Delete comments
      const q = query(collection(db, "comments"), where("postID", "==", id));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => deleteDoc(doc.ref));

      // Delete files from storage
      const subDirectories = ["photos", "videos", "files"];
      for (let dir of subDirectories) {
        const storageRef = ref(storage, `files/${user.id}/posts/${id}/${dir}`);
        try {
          const objects = await listAll(storageRef);
          objects.items.forEach(async (itemRef) => {
            await deleteObject(itemRef);
          });
        } catch (error) {
          console.log(`Error deleting ${dir} from Firebase Storage:`, error);
        }
      }

      toast({
        title: "Post deleted!",
        status: "info",
        isClosable: true,
        position: "top",
        duration: 5000,
      });

      if (location && location.pathname.includes("comments")) {
        navigate(DASHBOARD);
      }

      setLoading(false);
    }
  }

  async function deletePostAndReposts(postRef, originalPost) {
    const repostsQuery = query(
      collection(db, "posts"),
      where("originalPost.id", "==", postRef.id)
    );
    const repostsSnapshot = await getDocs(repostsQuery);

    // Delete comments on the original post
    const commentsQuery = query(
      collection(db, "comments"),
      where("postID", "==", postRef.id)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    await Promise.all(
      commentsSnapshot.docs.map((commentDoc) => deleteDoc(commentDoc.ref))
    );

    // Delete the post document and its related reposts
    await Promise.all([
      deleteDoc(postRef),
      ...repostsSnapshot.docs.map(async (repostDoc) => {
        const repostData = repostDoc.data();
        const repostId = repostDoc.id;

        // Delete comments on the repost
        const repostCommentsQuery = query(
          collection(db, "comments"),
          where("postID", "==", repostId)
        );
        const repostCommentsSnapshot = await getDocs(repostCommentsQuery);
        await Promise.all(
          repostCommentsSnapshot.docs.map((commentDoc) =>
            deleteDoc(commentDoc.ref)
          )
        );

        const repostRef = doc(db, "posts", repostId);

        // Recursively delete the reposts
        await deletePostAndReposts(repostRef, originalPost);

        // Delete the repost document
        await deleteDoc(repostRef);
      }),
    ]);

    if (originalPost && originalPost.id) {
      const originalPostRef = doc(db, "posts", originalPost.id);
      const originalPostSnapshot = await getDoc(originalPostRef);
      const originalPostData = originalPostSnapshot.data();
      const repostsCount = (originalPostData.reposts || []).length;

      // Update the reposts count for the original post
      await updateDoc(originalPostRef, {
        reposts: repostsCount,
      });
    }
  }

  return { deletePost, isLoading };
}

export function useRepostCount(userId) {
  const { user } = useAuth();
  const [repostCount, setRepostCount] = useState(0);

  useEffect(() => {
    if (userId) {
      const fetchRepostCount = async () => {
        try {
          const q = query(
            collection(db, "posts"),
            where("originalPost.uid", "==", userId)
          );
          const querySnapshot = await getDocs(q);
          const count = querySnapshot.size;
          setRepostCount(count);
        } catch (error) {
          console.log("Error fetching repost count:", error);
        }
      };

      fetchRepostCount();
      return;
    }
  }, [userId]);

  return repostCount;
}

export function usePostsAlgorithm() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastVisiblePost, setLastVisiblePost] = useState(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [fetchedPostIds, setFetchedPostIds] = useState([]);

  const calculateAffinity = async (post) => {
    const userDocRef = doc(db, "users", post.uid);
    const userDocSnap = await getDoc(userDocRef);

    const businessDocRef = doc(db, "businesses", post.uid);
    const businessDocSnap = await getDoc(businessDocRef);

    const userData = userDocSnap.data();
    const businessData = businessDocSnap.data();

    const snapshot = await getDocs(
      query(
        collection(
          db,
          user?.businessName ? "businesses" : "users",
          post?.uid,
          "subscriptions"
        ),
        where("status", "in", ["trialing", "active"])
      )
    );

    let affinity = 0;

    if (userDocSnap.exists() && userData.following) {
      post.likes.forEach((like) => {
        if (userData.following.includes(like)) {
          affinity += 1;
        }
        if (snapshot.docs.length > 0) {
          const doc = snapshot.docs[0];
          const status = doc.data().status;
          if (status === "trialing" || status === "active") {
            affinity += 5;
          }
        }
      });
    } else if (businessDocSnap.exists() && businessData.following) {
      post.likes.forEach((like) => {
        if (businessData.following.includes(like)) {
          affinity += 1;
        }
        if (snapshot.docs.length > 0) {
          const doc = snapshot.docs[0];
          const status = doc.data().status;
          if (status === "trialing" || status === "active") {
            affinity += 5;
          }
        }
      });
    }

    return affinity;
  };

  const calculatePopularity = (post) => {
    const popularity =
      (post.likes ? post.likes.length : 0) +
      (post.comments ? post.comments.length : 0) +
      (post.shares ? post.shares.length : 0);
    return popularity;
  };

  const calculateRelevance = async (post) => {
    let relevance = 0;

    const userDocRef = doc(db, "users", post.uid);
    const userDocSnap = await getDoc(userDocRef);

    const businessDocRef = doc(db, "businesses", post.uid);
    const businessDocSnap = await getDoc(businessDocRef);

    const userData = userDocSnap.data();
    const businessData = businessDocSnap.data();

    if (userDocSnap.exists()) {
      if (
        userData &&
        Array.isArray(userData.instrument) &&
        userData.instrument.includes(user.instrument)
      ) {
        relevance += 1;
      }

      if (user.location && userData.location === user.location) {
        relevance += 1;
      }
    } else if (businessDocSnap.exists() && user.location) {
      if (businessData.locations.includes(user.location)) {
        relevance += 1;
      }
    }

    return relevance;
  };

  const fetchAndSortPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, "posts"),
        orderBy("date", "desc"),
        orderBy("id", "desc"),
        limit(4)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const allPostsData = postsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const postsWithValues = await Promise.all(
        allPostsData.map(async (post) => {
          const affinity = await calculateAffinity(post);
          const popularity = calculatePopularity(post);
          const relevance = await calculateRelevance(post);

          return {
            ...post,
            affinity,
            popularity,
            relevance,
          };
        })
      );

      const sortedPosts = postsWithValues.sort((postA, postB) => {
        if (
          postA.affinity + postA.popularity + postA.relevance >
          postB.affinity + postB.popularity + postB.relevance
        ) {
          return -1;
        } else if (
          postA.affinity + postA.popularity + postA.relevance <
          postB.affinity + postB.popularity + postB.relevance
        ) {
          return 1;
        }

        return postB.date - postA.date;
      });

      setPosts(sortedPosts);
      setLastVisiblePost(sortedPosts[sortedPosts.length - 1]);
      setFetchedPostIds(allPostsData.map((post) => post.id));
      setHasMorePosts(sortedPosts.length >= 4);
    } catch (error) {
      console.log("Error fetching posts:", error);
      setError(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAndSortPosts();
    return;
  }, [user]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "posts"),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          const postId = change.doc.id;
          const updatedPost = { ...change.doc.data(), id: postId };

          // Check if the post still exists in the Firestore collection
          const postExists = await getDoc(doc(db, "posts", postId));

          if (!postExists.data()) {
            // If the post doesn't exist, consider it as removed
            setPosts((prevPosts) =>
              prevPosts.filter((post) => post.id !== postId)
            );
            return;
          }

          setPosts((prevPosts) => {
            // Check if the post already exists in the list
            const postIndex = prevPosts.findIndex((post) => post.id === postId);
            if (postIndex !== -1) {
              // If exists, update it
              return prevPosts.map((post) =>
                post.id === postId ? updatedPost : post
              );
            } else {
              // If not exists, append it to the list

              if (user?.id == change.doc.data().uid) {
                return [updatedPost, ...prevPosts];
              } else {
                return [...prevPosts, updatedPost];
              }
            }
          });
        });
      },
      (error) => {
        console.error("Error in onSnapshot:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const loadMorePosts = async () => {
    try {
      setLoading(true);

      let postsQuery = query(
        collection(db, "posts"),
        orderBy("date", "desc"), // Use your custom sort criteria here
        limit(5)
      );

      if (lastVisiblePost) {
        postsQuery = query(
          collection(db, "posts"),
          orderBy("date", "desc"), // Use your custom sort criteria here
          startAfter(lastVisiblePost.date),
          limit(5)
        );
      }

      const morePostsSnapshot = await getDocs(postsQuery);
      const morePostsData = morePostsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const sortedMorePosts = morePostsData.sort((postA, postB) => {
        const affinityA = calculateAffinity(postA);
        const affinityB = calculateAffinity(postB);

        if (affinityA > affinityB) {
          return -1;
        } else if (affinityA < affinityB) {
          return 1;
        }

        const popularityA = calculatePopularity(postA);
        const popularityB = calculatePopularity(postB);

        if (popularityA > popularityB) {
          return -1;
        } else if (popularityA < popularityB) {
          return 1;
        }

        const relevanceA = calculateRelevance(postA);
        const relevanceB = calculateRelevance(postB);

        if (relevanceA > relevanceB) {
          return -1;
        } else if (relevanceA < relevanceB) {
          return 1;
        }

        return postB.date - postA.date;
      });

      const nextPosts = sortedMorePosts.filter(
        (post) => !fetchedPostIds.includes(post.id)
      );

      setPosts((prevPosts) => [...prevPosts, ...nextPosts]);
      setLastVisiblePost(nextPosts[nextPosts.length - 1]);
      setFetchedPostIds((prevIds) => [
        ...prevIds,
        ...nextPosts.map((post) => post.id),
      ]);
      setHasMorePosts(morePostsSnapshot.docs.length > 4);

      setLoading(false);
    } catch (error) {
      console.log("Error fetching more posts:", error);
      setError(error);
      setHasMorePosts(false);
    }
  };

  return { posts, isLoading, error, loadMorePosts, hasMorePosts };
}
