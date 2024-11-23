import {
  Box,
  Button,
  Checkbox,
  Flex,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
} from '@firebase/firestore';
import {
  getDownloadURL,
  ref,
  updateMetadata,
  uploadBytes,
} from 'firebase/storage';
import { db, storage } from 'lib/firebase';
import { useEffect, useRef, useState } from 'react';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth';
import { useNotifications } from './notifications';
import { firestore } from 'lib/firebase';
import { PROTECTED } from 'lib/routes';
import UserCard from 'components/network/UserCard';

export function useUser(id) {
  const userQuery = query(doc(db, 'users', id));
  const businessQuery = query(doc(db, 'businesses', id));
  const [userData, userLoading] = useDocumentData(userQuery);
  const [businessData, businessLoading] = useDocumentData(businessQuery);

  const user = userData || businessData;
  const isLoading = userLoading || businessLoading;

  return { user, isLoading };
}

export function GetUsername({ userIds }) {
  const [usernames, setUsernames] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedData = useRef(false);

  useEffect(() => {
    const fetchUsernames = async () => {
      if (!hasFetchedData.current) {
        try {
          const usernamePromises = userIds.map(async (userId) => {
            const userQuery = query(doc(db, 'users', userId));
            const businessQuery = query(doc(db, 'businesses', userId));
            const [userData, businessData] = await Promise.all([
              await getDoc(userQuery),
              await getDoc(businessQuery),
            ]);

            const user = userData.data()
              ? userData.data()
              : businessData.data();
            const username = user?.username || '';
            return { user };
          });

          const fetchedUsernames = await Promise.all(usernamePromises);
          setUsernames(fetchedUsernames);
          setLoading(false);
          hasFetchedData.current = true;
        } catch (error) {
          console.error(error);
        }
      }
    };

    fetchUsernames();
  }, [userIds]);

  return (
    <VStack>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        usernames.map(({ user }) => (
          <>
            <UserCard user={user} />
          </>
        ))
      )}
    </VStack>
  );
}

export function GetUsernameSingleNoBusiness({
  userId,
  handleSelectFollower,
  selectedFollowers,
  setSelectedFollowes,
}) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetchedData = useRef(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!hasFetchedData.current) {
        try {
          const userRef = doc(db, 'users', userId);
          const userData = await getDoc(userRef);

          if (userData.exists()) {
            setUserData(userData.data());
          }
          setLoading(false);
          hasFetchedData.current = true;
        } catch (error) {
          console.error(error);
        }
      }
    };

    fetchUserData();
  }, [userId]);
  console.log(userData);

  return (
    <VStack>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        userData && (
          <Flex
            key={userId}
            align="center"
            justify="space-between"
            p={2}
            width={'100%'}
            borderBottom="1px solid #eee"
          >
            <Checkbox
              onChange={() => handleSelectFollower(userId)}
              colorScheme="blue"
              size="lg"
            />

            <Box width={'100%'} ml={1}>
              <UserCard user={userData} isNetwork={false} />
            </Box>
          </Flex>
        )
      )}
    </VStack>
  );
}

export const updateUserProfile = async (userId, profileUpdates) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, profileUpdates);
    console.log('User profile updated successfully.');
  } catch (error) {
    console.error('Error updating user profile: ', error);
  }
};

export function GetUsersFromId(userIds) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetchedData = useRef(false);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!hasFetchedData.current && userIds && userIds.length > 0) {
        try {
          const userPromises = userIds.map((userId) =>
            getDoc(doc(db, 'users', userId))
          );
          const userDocs = await Promise.all(userPromises);

          const usersData = userDocs.map((doc) =>
            doc.exists() ? doc.data() : null
          );
          setUsers(usersData);
        } catch (error) {
          console.error('Error fetching users:', error);
          setError(error);
        } finally {
          setLoading(false);
          hasFetchedData.current = true;
        }
      }
    };

    fetchUsers();
  }, [userIds]);

  return { users, loading, error };
}

export function useUsername(username) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (username) {
        // Add a condition to check if the username is defined
        const q = query(
          collection(db, 'users'),
          where('username', '==', username)
        );
        const businessQ = query(
          collection(db, 'businesses'),
          where('username', '==', username)
        );

        const querySnapshot = await getDocs(q);
        const businessQuerySnapshot = await getDocs(businessQ);
        if (!querySnapshot.empty || !businessQuerySnapshot.empty) {
          const userData = !querySnapshot.empty
            ? querySnapshot.docs[0].data()
            : businessQuerySnapshot.docs[0].data();
          setUser(userData);
        }
      }
      setIsLoading(false);
    }

    fetchData();
    return;
  }, [username]);

  return { user, isLoading };
}

export async function getIDfromUsername(username) {
  const userCollection = collection(db, 'users');
  const userQuery = query(userCollection, where('username', '==', username));
  const businessCollection = collection(db, 'businesses');
  const businessQuery = query(
    businessCollection,
    where('username', '==', username)
  );

  try {
    const querySnapshot = await getDocs(userQuery);
    const businessQuerySnapshot = await getDocs(businessQuery);

    if (!querySnapshot.empty || !businessQuerySnapshot.empty) {
      const userDoc = !querySnapshot.empty ? querySnapshot.docs[0].data() : {};
      const businessDoc = !businessQuerySnapshot.empty
        ? businessQuerySnapshot.docs[0].data()
        : {};
      const id = userDoc.id || businessDoc.id;

      return id; // Return the ID directly
    } else {
      console.log('No user found with username:', username);
      return undefined;
    }
  } catch (error) {
    console.error('Error fetching user ID:', error);
    throw error;
  }
}

export function useUpdateAvatar(uid) {
  const [fileUrl, setFile] = useState(null);
  const [isLoading, setLoading] = useState(false);
  async function updateAvatar(file) {
    if (!file) {
      return;
    }

    setLoading(true);

    const fileRef = ref(storage, 'avatars/' + uid);
    await uploadBytes(fileRef, file);

    // Update the metadata to set the content type as image/jpeg
    const metadata = { contentType: file.type };
    await updateMetadata(fileRef, metadata);

    const avatarURL = await getDownloadURL(fileRef);

    const docRef = doc(db, 'users', uid);
    const businessDocRef = doc(db, 'businesses', uid);
    const docRefData = await getDoc(docRef);
    const businessDocRefData = await getDoc(businessDocRef);

    if (docRefData.exists()) {
      await updateDoc(docRef, { avatar: avatarURL });
    } else if (businessDocRefData.exists()) {
      await updateDoc(businessDocRef, { avatar: avatarURL });
    }
    setLoading(false);
  }

  return {
    setFile,
    updateAvatar,
    isLoading,
    fileURL: fileUrl && URL.createObjectURL(fileUrl),
  };
}

export function useFollowUser(userId, authUserId) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { sendNotification } = useNotifications();
  const { user: authUser } = useAuth();
  const [followingList, setFollowingList] = useState([]);

  useEffect(() => {
    async function checkIsFollowing() {
      if (authUserId) {
        const userQuerySnapshot = await getDocs(
          query(collection(db, 'users'), where('id', '==', authUserId))
        );
        const businessQuerySnapshot = await getDocs(
          query(collection(db, 'businesses'), where('id', '==', authUserId))
        );

        if (!userQuerySnapshot.empty) {
          setFollowingList(userQuerySnapshot.docs[0].data().following);
        } else if (!businessQuerySnapshot.empty) {
          setFollowingList(businessQuerySnapshot.docs[0].data().following);
        }
        setIsFollowing(followingList && followingList.includes(userId));
      }
    }

    checkIsFollowing();
    return;
  }, [userId, authUserId, followingList]); // Include `followingList` as a dependency

  const followUser = async () => {
    try {
      setIsLoading(true);

      const userDocRef = doc(collection(db, 'users'), authUserId);
      const userDocSnapshot = await getDoc(userDocRef);

      const businessDocRef = doc(collection(db, 'businesses'), authUserId);
      const businessDocSnapshot = await getDoc(businessDocRef);

      if (userDocSnapshot.exists() || businessDocSnapshot.exists()) {
        const userDocData = userDocSnapshot.exists()
          ? userDocSnapshot.data()
          : businessDocSnapshot.data();
        const followingList = userDocData?.following || [];

        if (userDocSnapshot.exists()) {
          await updateDoc(userDocRef, {
            following: [...followingList, userId],
          });
        } else if (businessDocSnapshot.exists()) {
          await updateDoc(businessDocRef, {
            following: [...followingList, userId],
          });
        }

        const followedUserDocRef = doc(collection(db, 'users'), userId);
        const followedUserDocSnapshot = await getDoc(followedUserDocRef);

        const followedBusinessDocRef = doc(
          collection(db, 'businesses'),
          userId
        );
        const followedBusinessDocSnapshot = await getDoc(
          followedBusinessDocRef
        );

        if (
          followedUserDocSnapshot.exists() ||
          followedBusinessDocSnapshot.exists()
        ) {
          const followedUserDocData =
            followedUserDocSnapshot.data() ||
            followedBusinessDocSnapshot.data();
          const followersList = followedUserDocData.followers || [];

          if (followedUserDocSnapshot.exists()) {
            await updateDoc(followedUserDocRef, {
              followers: [...followersList, authUserId],
            });
          } else if (followedBusinessDocSnapshot.exists()) {
            await updateDoc(followedBusinessDocRef, {
              followers: [...followersList, authUserId],
            });
          }
        }
        await sendNotification({
          title: 'New Follower',
          content: `@${authUser.username} started following you.`,
          uid: userId,
          from: authUserId,
          type: 'follow',
          time: Date.now(),
        });

        setIsFollowing(true);
        setIsLoading(false);

        toast({
          title: 'User followed!',
          status: 'success',
          isClosable: true,
          position: 'top',
          duration: 5000,
        });
      } else {
        console.error('User document does not exist');
        setIsLoading(false);

        toast({
          title: 'Failed to follow user',
          description:
            'An error occurred while following the user. Please try again.',
          status: 'error',
          isClosable: true,
          position: 'top',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error following user:', error);
      setIsLoading(false);

      toast({
        title: 'Failed to follow user',
        description:
          'An error occurred while following the user. Please try again.',
        status: 'error',
        isClosable: true,
        position: 'top',
        duration: 5000,
      });
    }
  };

  const unfollowUser = async () => {
    try {
      setIsLoading(true);

      const userDocRef = doc(collection(db, 'users'), authUserId);
      const userDocSnapshot = await getDoc(userDocRef);

      const businessDocRef = doc(collection(db, 'businesses'), authUserId);
      const businessDocSnapshot = await getDoc(businessDocRef);

      if (userDocSnapshot.exists() || businessDocSnapshot.exists()) {
        const userDocData = userDocSnapshot.exists()
          ? userDocSnapshot.data()
          : businessDocSnapshot.data();
        const followingList = userDocData?.following || [];
        if (userDocSnapshot.exists()) {
          await updateDoc(userDocRef, {
            following: followingList.filter((id) => id !== userId),
          });
        } else if (businessDocSnapshot.exists()) {
          await updateDoc(businessDocRef, {
            following: followingList.filter((id) => id !== userId),
          });
        }
      }

      const followedUserDocRef = doc(collection(db, 'users'), userId);
      const followedUserDocSnapshot = await getDoc(followedUserDocRef);

      const followedBusinessDocRef = doc(collection(db, 'businesses'), userId);
      const followedBusinessDocSnapshot = await getDoc(followedBusinessDocRef);

      if (
        followedUserDocSnapshot.exists() ||
        followedBusinessDocSnapshot.exists()
      ) {
        const followedUserDocData = followedUserDocSnapshot.exists()
          ? followedUserDocSnapshot.data()
          : followedBusinessDocSnapshot.data();
        const followersList = followedUserDocData.followers || [];

        if (followedUserDocSnapshot.exists()) {
          await updateDoc(followedUserDocRef, {
            followers: followersList.filter((id) => id !== authUserId),
          });
        } else if (followedBusinessDocSnapshot.exists()) {
          await updateDoc(followedBusinessDocRef, {
            followers: followersList.filter((id) => id !== authUserId),
          });
        }
      }

      // Check if notification exists
      const notificationSnapshot = await getDocs(
        query(
          collection(db, 'notifications'),
          where('uid', '==', userId),
          where('type', '==', 'follow'),
          where('from', '==', authUserId)
        )
      );

      if (notificationSnapshot.size > 0) {
        notificationSnapshot.docs.forEach((docSnapshot) => {
          deleteDoc(doc(db, 'notifications', docSnapshot.id));
        });
      }

      setIsFollowing(false);
      setIsLoading(false);

      toast({
        title: 'User unfollowed!',
        status: 'success',
        isClosable: true,
        position: 'top',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      setIsLoading(false);

      toast({
        title: 'Failed to unfollow user',
        description:
          'An error occurred while unfollowing the user. Please try again.',
        status: 'error',
        isClosable: true,
        position: 'top',
        duration: 5000,
      });
    }
  };

  return { isFollowing, isLoading, followUser, unfollowUser };
}

export function FollowButton({ userId, authUserId, isMobile }) {
  const { isFollowing, isLoading, followUser, unfollowUser } = useFollowUser(
    userId,
    authUserId
  );
  const {
    count: followersCount,
    isLoading: followersLoading,
    updateFollowersCount,
  } = useFollowersCount(userId);
  const toast = useToast();

  const handleFollowUser = async () => {
    await followUser();
    updateFollowersCount(); // Update followers count after following a user
  };

  const handleUnfollowUser = async () => {
    await unfollowUser();
    updateFollowersCount(); // Update followers count after unfollowing a user
  };

  if (followersLoading) return null;

  return (
    <>
      {!isMobile && (
        <Button
          colorScheme={isFollowing ? 'gray' : 'blue'}
          isLoading={isLoading}
          onClick={isFollowing ? handleUnfollowUser : handleFollowUser}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
      )}

      {isMobile && (
        <Button
          pos="flex"
          mb="-10"
          ml={{ base: 'auto', md: 'auto' }}
          right="auto"
          colorScheme="blue"
          onClick={isFollowing ? handleUnfollowUser : handleFollowUser}
          isLoading={isLoading}
          rounded={{ base: 'full', md: 'md' }}
          size="md"
          display={{ base: 'flex', md: 'flex' }}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}{' '}
        </Button>
      )}
    </>
  );
}

export async function getFollowersCount(userId) {
  const usersRef = collection(db, 'users');
  const businessRef = collection(db, 'businesses');

  // Try to get the user first
  const userDoc = doc(usersRef, userId);
  const userSnapshot = await getDoc(userDoc);

  if (userSnapshot.exists()) {
    const user = userSnapshot.data();
    return user.followers ? user.followers.length : 0;
  }

  // If user not found, try to get the business
  const businessDoc = doc(businessRef, userId);
  const businessSnapshot = await getDoc(businessDoc);

  if (businessSnapshot.exists()) {
    const business = businessSnapshot.data();
    return business.followers ? business.followers.length : 0;
  }

  // If neither user nor business is found, return 0 followers
  return 0;
}

export function useFollowersCount(userId) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const updateFollowersCount = async () => {
    try {
      const updatedCount = await getFollowersCount(userId);
      setCount(updatedCount);
    } catch (error) {
      console.error('Error updating followers count:', error);
    }
  };

  useEffect(() => {
    async function fetchFollowersCount() {
      try {
        const count = await getFollowersCount(userId);
        setCount(count);
      } catch (error) {
        console.error('Error fetching followers count:', error);
      }
      setIsLoading(false);
    }

    fetchFollowersCount();
    return;
  }, [userId]);

  return { count, isLoading, updateFollowersCount };
}

export function useUpdateUserSettings() {
  const [isLoading, setLoading] = useState(false);

  async function updateUserSettings({
    user,
    signed,
    username,
    instruments,
    genres,
    roles,
    location,
    bio,
    isProfileLocked,
  }) {
    setLoading(true);

    try {
      const userRef = doc(db, 'users', user?.id);

      await updateDoc(userRef, {
        username: username !== undefined ? username : user?.username,
        instrument: instruments || user?.instrument || [],
        genres: genres || user?.genres || [],
        role: roles || user?.roles || '',
        location: location || user?.location || '',
        signed: signed || user?.signed || false,
        bio: bio || user?.bio || '',
        isProfileLocked: isProfileLocked || user?.isProfileLocked || false,
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw new Error('Failed to update user settings.');
    }
  }
  const { user } = useAuth();

  async function updateBusinessSettings({
    username,
    locations,
    languages,
    natureOfBusiness,
    phoneNumber,
    bio,
  }) {
    setLoading(true);
    try {
      const userRef = doc(db, 'businesses', user?.id);
      await updateDoc(userRef, {
        username: username || user.username,
        locations: locations || user.locations,
        languages: languages || user.languages,
        natureOfBusiness: natureOfBusiness || user.natureOfBusiness,
        phoneNumber: phoneNumber || user.phoneNumber,
        bio: bio || user.bio,
      });

      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw new Error('Failed to update user settings.');
    }
  }

  return { updateUserSettings, isLoading, updateBusinessSettings };
}
