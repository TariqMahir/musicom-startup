import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  Textarea,
  useBreakpointValue,
  useColorMode,
  useDisclosure,
  useToast,
  VStack,
  Wrap,
  WrapItem,
  UnorderedList,
  ListItem,
  Avatar as Avatarr,
  Avatar,
} from '@chakra-ui/react';
import PostsList from 'components/post/PostsList';
import {
  getIDfromUsername,
  GetUsername,
  useFollowersCount,
  useFollowUser,
  useUsername,
} from 'hooks/users';
import { useUser } from 'hooks/users';
import { useEffect, useState } from 'react';
import React, { useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import EditProfile from './EditProfile';
import { useAuth } from 'hooks/auth';
import { Icon } from '@chakra-ui/react';
import { usePosts } from 'hooks/posts';
import PageNotFound from 'utils/404Error';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from 'lib/firebase';
import { collection, addDoc } from '@firebase/firestore';
import { useNotifications } from 'hooks/notifications';
import {
  updateDoc,
  getDocs,
  query,
  where,
  deleteDoc,
} from '@firebase/firestore';
import { PROTECTED } from 'lib/routes';
import { Carousel } from 'react-responsive-carousel';
import { usePortfolio, useUploadPortfolio } from 'hooks/portfolio';
import { getMetadata, getStorage, ref } from 'firebase/storage';
import { CloseIcon, DeleteIcon } from '@chakra-ui/icons';
import Lottie from 'lottie-react';
import nodeals from './nodeals';
import AudioPlayer from 'components/messageMu/player.js';
import LocationPin from './assets/location-pin.svg';

function VideoPlayer({ url }) {
  return (
    <Box
      maxW={{ base: '100%', md: '90%' }}
      mx="auto"
      mt={10}
      objectFit="contain"
      orderRadius="md"
      overflow="hidden"
    >
      <video src={url} width="100%" height="100%" controls />
    </Box>
  );
}

const PromiseRender = ({ urls, getFileType, name }) => {
  const [elements, setElements] = useState([]);
  const [audios, setAudios] = useState([]);

  useEffect(() => {
    const fetchElements = async () => {
      const promises = urls.map((url, index) => {
        return getFileType(url).then((result) => {
          if (result && result.startsWith('image')) {
            return (
              <div key={index}>
                <Image
                  src={url}
                  alt={`Photo ${index + 1}`}
                  objectFit="contain"
                  borderRadius="md"
                  maxHeight={'400px'}
                  minHeight={'200px'}
                  // mb="10"
                />
              </div>
            );
          } else if (result && result.startsWith('video')) {
            return (
              <div
                key={index}
                style={{ objectFit: 'contain' }}
                maxHeight={'400px'}
              >
                <VideoPlayer url={url} />
              </div>
            );
          } else {
            return null;
          }
        });
      });

      const elements = await Promise.all(promises);
      setElements(elements.filter((element) => element !== null));
    };

    fetchElements();
  }, [urls, getFileType]);

  useEffect(() => {
    const fetchAudios = async () => {
      const promises = urls.map((url, index) => {
        return getFileType(url).then((result) => {
          if (result && result.startsWith('audio')) {
            return (
              <div key={index}>
                {/* <audio-player
                  src={url}
                  title={`Audio ${index + 1}`}
                ></audio-player> */}
                <audio controls>
                  <source src={url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            );
          } else {
            return null;
          }
        });
      });

      const audioElements = await Promise.all(promises);
      setAudios(audioElements.filter((element) => element !== null));
    };

    fetchAudios();
  }, [urls]);

  if (!customElements.get('audio-player')) {
    customElements.define('audio-player', AudioPlayer);
  }

  return (
    <>
      <Carousel
        showThumbs={false}
        showStatus={false}
        showIndicators={urls.length > 1}
        infiniteLoop={true}
        autoPlay={false}
        renderArrowPrev={(onClickHandler, hasPrev) =>
          hasPrev && (
            <Button
              size={'sm'}
              aria-label="Previous"
              variant="ghost"
              onClick={onClickHandler}
              position="absolute"
              top="50%"
              left="8"
              transform="translateY(-50%)"
              bg="whiteAlpha.500"
              _hover={{ bg: 'whiteAlpha.500' }}
              _active={{ bg: 'whiteAlpha.500' }}
              zIndex="999"
            >
              <Icon as={FiChevronLeft} />
            </Button>
          )
        }
        renderArrowNext={(onClickHandler, hasNext) =>
          hasNext && (
            <Button
              size={'sm'}
              aria-label="Next"
              variant="ghost"
              onClick={onClickHandler}
              position="absolute"
              top="50%"
              right="8"
              transform="translateY(-50%)"
              bg="whiteAlpha.500"
              _hover={{ bg: 'whiteAlpha.500' }}
              _active={{ bg: 'whiteAlpha.500' }}
              zIndex="999"
            >
              <Icon as={FiChevronRight} />
            </Button>
          )
        }
        renderIndicator={(onClickHandler, isSelected, index, label) => (
          <Box
            key={index}
            bg={isSelected ? 'blue.500' : 'gray.300'}
            display="inline-block"
            borderRadius="full"
            width="2"
            height="2"
            mx="1"
            cursor="pointer"
            onClick={onClickHandler}
            _hover={{ bg: 'blue.500' }}
          />
        )}
      >
        {elements}
      </Carousel>
      {audios && (
        <Center>
          <Box mt="10">{audios}</Box>
        </Center>
      )}
    </>
  );
};

export const updateUserProfile = async (userId, profileUpdates) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, profileUpdates);
    console.log('User profile updated successfully.');
  } catch (error) {
    console.error('Error updating user profile: ', error);
  }
};

function DealItem({ deal, id }) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [usernames, setUsernames] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedData = useRef(false);

  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const fetchUsernames = async () => {
      if (!hasFetchedData.current) {
        try {
          const userQuery = query(doc(db, 'users', deal.from));
          const businessQuery = query(doc(db, 'businesses', deal.from));
          const [userData, businessData] = await Promise.all([
            await getDoc(userQuery),
            await getDoc(businessQuery),
          ]);

          const fetchedUser = userData.data()
            ? userData.data()
            : businessData.data();
          setUsernames([{ user: fetchedUser }]);
          setLoading(false);
          hasFetchedData.current = true;
        } catch (error) {
          console.error(error);
        }
      }
    };

    fetchUsernames();
  }, [deal.from]);

  const handleApprove = () => {
    // straight to message
  };

  const openMessage = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleDeny = async () => {
    const dealIdToDelete = deal?.id;
    console.log(dealIdToDelete);
    try {
      const requestsRef = collection(
        db,
        user?.businessName ? 'businesses' : 'users',
        user?.id,
        'requests'
      );

      console.log(`Attempting to delete document with id: ${dealIdToDelete}`);

      const dealDocRef = doc(requestsRef, dealIdToDelete);
      const dealDocSnapshot = await getDoc(dealDocRef);

      if (dealDocSnapshot.exists()) {
        await deleteDoc(dealDocRef);
        console.log(`Deal ${dealIdToDelete} deleted successfully`);
      } else {
        console.log(`No matching document found for deal ${dealIdToDelete}`);
      }
    } catch (error) {
      console.error(`Error deleting deal ${deal?.id}:`, error);
    }
  };

  return (
    <ListItem key={deal.id} mb={4}>
      {loading
        ? 'Loading...'
        : usernames.map(({ user }) => (
            <Box
              width={'100%'}
              borderRadius={'lg'}
              boxShadow={'xl'}
              borderWidth="1px"
              borderColor="rgba(72, 50, 133, 0.1)"
              backgroundColor="white"
              p={2}
              style={{
                boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)', // Custom CSS for shadow
              }}
              onClick={openMessage}
            >
              <Stack direction={'row'} spacing={4} align={'center'}>
                <Avatar size={'md'} src={user?.avatar || ''} />
                <Box flex={1}>
                  <Text as="b" fontSize="sm">
                    @{user?.username}
                  </Text>
                  <Text mt={2} fontSize={'8px'} noOfLines={3}>
                    {deal.message.length > 10
                      ? `${deal.message.substring(0, 1)}...`
                      : deal.message}
                  </Text>
                </Box>
                <Text fontSize={'xs'} color={'gray.500'}>
                  5 minutes ago
                </Text>
              </Stack>
            </Box>
          ))}
      <Modal isOpen={showModal} onClose={handleCloseModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Message</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{deal.message}</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" onClick={handleDeny}>
              Deny
            </Button>
            <Button
              colorScheme="green"
              ml={3}
              onClick={() => {
                window.location.href = `${PROTECTED}/messages/${deal.from}`;
              }}
            >
              Approve
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      =======
      {loading
        ? 'Loading...'
        : usernames.map(({ user }) => (
            <Box
              width={'100%'}
              borderRadius={'lg'}
              boxShadow={'xl'}
              borderWidth="1px"
              borderColor="rgba(72, 50, 133, 0.1)"
              backgroundColor="white"
              p={4}
              style={{
                boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)', // Custom CSS for shadow
              }}
              onClick={openMessage}
            >
              <Stack direction={'row'} spacing={4} align={'center'}>
                <Avatar size={'lg'} src={user?.avatar || ''} />
                <Box flex={1}>
                  <Text as="b" fontSize={'lg'}>
                    @{user?.username}
                  </Text>
                  <Text mt={2} fontSize={'md'} noOfLines={3}>
                    {deal.message}
                  </Text>
                </Box>
                <Text fontSize={'sm'} color={'gray.500'}>
                  5 minutes ago
                </Text>
              </Stack>
            </Box>
          ))}
      <Modal isOpen={showModal} onClose={handleCloseModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Message</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{deal.message}</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" onClick={handleDeny}>
              Deny
            </Button>
            <Button
              colorScheme="green"
              ml={3}
              onClick={() => {
                window.location.href = `${PROTECTED}/messages/${deal.from}`;
              }}
            >
              Approve
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      >>>>>>> 46a27072045cb72dd96d215a61049df5023f23a5
    </ListItem>
  );
}

export function DealsComponent({ receivedDeals }) {
  if (!receivedDeals || receivedDeals.length === 0) {
    return (
      <Box height={'100%'} width={'100%'}>
        <Lottie animationData={nodeals} />
      </Box>
    );
  }

  return (
    <>
      <div
        style={{ maxHeight: '580px', maxWidth: 'auto', overflowY: 'scroll' }}
      >
        <UnorderedList styleType="none" pl={0}>
          {receivedDeals.map((deal) => (
            <DealItem key={deal.id} deal={deal} id={deal.id} />
          ))}
        </UnorderedList>
      </div>
    </>
  );
}

export function useDeal(userId, authUserId) {
  const [isRequested, setIsRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { sendNotification } = useNotifications();
  const { user: authUser } = useAuth();
  const [dealList, setDealingList] = useState([]);

  const [receivedDeals, setReceivedDeals] = useState([]);

  const fetchReceivedDeals = async () => {
    try {
      if (authUserId) {
        // Logic to fetch received deals
        const dealUserDocRef = doc(collection(db, 'users'), authUserId);
        const dealUserDocSnapshot = await getDoc(dealUserDocRef);
        const dealBusinessDocRef = doc(
          collection(db, 'businesses'),
          authUserId
        );
        const dealBusinessDocSnapshot = await getDoc(dealUserDocRef);

        if (dealUserDocSnapshot.exists() || dealBusinessDocSnapshot.exists()) {
          const dealUserDocData = dealUserDocSnapshot.exists()
            ? dealUserDocSnapshot.data()
            : dealBusinessDocSnapshot.exists()
            ? dealBusinessDocSnapshot.data()
            : [];
          const dealsList = dealUserDocData.deals || [];

          // Update received deals state with fetched deals
          setReceivedDeals(dealsList);
        }
      }
    } catch (error) {
      console.error('Error fetching received deals:', error);
      // Handle errors if needed
    }
  };

  useEffect(() => {
    async function checkIsRequested() {
      if (authUserId) {
        const userQuerySnapshot = await getDocs(
          collection(db, 'users'),
          where('id', '==', authUserId)
        );
        const businessQuerySnapshot = await getDocs(
          collection(db, 'businesses'),
          where('id', '==', authUserId)
        );

        if (
          !userQuerySnapshot.empty &&
          userQuerySnapshot.docs[0].data().dealing
        ) {
          setDealingList(userQuerySnapshot.docs[0].data().dealing);
        } else if (
          !businessQuerySnapshot.empty &&
          businessQuerySnapshot.docs[0].data().dealing
        ) {
          setDealingList(businessQuerySnapshot.docs[0].data().dealing);
        } else {
          setDealingList([]);
        }

        setIsRequested(dealList.includes(userId));
      }
    }

    if (authUserId) {
      fetchReceivedDeals();
      checkIsRequested();
    }
  }, [authUserId, userId]);

  const requestUser = async () => {
    try {
      setIsLoading(true);

      const userDocRef = doc(collection(db, 'users'), authUserId);
      const userDocSnapshot = await getDoc(userDocRef);

      const businessDocRef = doc(collection(db, 'businesses'), authUserId);
      const businessDocSnapshot = await getDoc(businessDocRef);

      if (userDocSnapshot.exists() || businessDocSnapshot.exists()) {
        const userDocData = userDocSnapshot.data();
        const businessDocData = businessDocSnapshot.data();
        const dealingList =
          userDocSnapshot.exists() && userDocData.dealing
            ? userDocData.dealing
            : businessDocSnapshot.exists() && businessDocData.dealing
            ? businessDocData.dealing
            : [];

        if (userDocSnapshot.exists()) {
          await updateDoc(userDocRef, {
            dealing: [...dealingList, userId],
          });
        } else if (businessDocSnapshot.exists()) {
          await updateDoc(businessDocRef, {
            dealing: [...dealingList, userId],
          });
        }

        const dealUserDocRef = doc(collection(db, 'users'), authUserId);
        const dealUserDocSnapshot = await getDoc(dealUserDocRef);
        const dealBusinessDocRef = doc(
          collection(db, 'businesses'),
          authUserId
        );
        const dealBusinessDocSnapshot = await getDoc(dealUserDocRef);
        if (dealUserDocSnapshot.exists() || dealBusinessDocSnapshot.exists()) {
          const dealUserDocData = dealUserDocSnapshot.exists()
            ? dealUserDocSnapshot.data()
            : dealBusinessDocSnapshot.exists()
            ? dealBusinessDocSnapshot.data()
            : [];
          const dealsList = dealUserDocData.deals || [];

          if (dealUserDocSnapshot.exists()) {
            await updateDoc(dealUserDocRef, {
              deals: [...dealsList, authUserId],
            });
          } else if (dealBusinessDocSnapshot.exists()) {
            await updateDoc(dealBusinessDocRef, {
              deals: [...dealsList, authUserId],
            });
          }

          setIsRequested(true);
          setIsLoading(false);

          toast({
            title: 'Request Sent',
            status: 'success',
            isClosable: true,
            position: 'top',
            duration: 5000,
          });
        } else {
          console.error('Deal user document does not exist');
          setIsLoading(false);

          toast({
            title: 'Failed to send request',
            description:
              'An error occurred while requesting the user. Please try again.',
            status: 'error',
            isClosable: true,
            position: 'top',
            duration: 5000,
          });
        }
      } else {
        console.error('User document does not exist');
        setIsLoading(false);

        toast({
          title: 'Failed to send deal',
          description:
            'An error occurred while requesting the user. Please try again.',
          status: 'error',
          isClosable: true,
          position: 'top',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error requesting user:', error);
      setIsLoading(false);

      toast({
        title: 'Failed to request user',
        description:
          'An error occurred while requesting the user. Please try again.',
        status: 'error',
        isClosable: true,
        position: 'top',
        duration: 5000,
      });
    }
  };

  const cancelDealUser = async () => {
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
        const dealingList = userDocData.dealing || [];

        if (userDocSnapshot.exists()) {
          await updateDoc(userDocRef, {
            dealing: dealingList.filter((id) => id !== userId),
          });
        } else if (businessDocSnapshot.exists) {
          await updateDoc(businessDocRef, {
            dealing: dealingList.filter((id) => id !== userId),
          });
        }
      }

      const dealUserDocRef = doc(collection(db, 'users'), userId);
      const dealUserDocSnapshot = await getDoc(dealUserDocRef);
      const dealBusinessDocRef = doc(collection(db, 'businesses'), userId);
      const dealBusinessDocSnapshot = await getDoc(dealBusinessDocRef);

      if (dealUserDocSnapshot.exists() || dealBusinessDocSnapshot.exists()) {
        const dealUserDocData = dealUserDocSnapshot.exists()
          ? dealUserDocSnapshot.data()
          : dealBusinessDocSnapshot.data();
        const dealsList = dealUserDocData.deals || [];

        if (dealUserDocSnapshot.exists()) {
          await updateDoc(dealUserDocRef, {
            deals: dealsList.filter((id) => id !== authUserId),
          });
        } else if (dealBusinessDocSnapshot.exists()) {
          await updateDoc(dealBusinessDocRef, {
            deals: dealsList.filter((id) => id !== authUserId),
          });
        }
      }

      // Check if notification exists
      const notificationSnapshot = await getDocs(
        query(
          collection(db, 'notifications'),
          where('uid', '==', userId),
          where('type', '==', 'deal'),
          where('from', '==', authUserId)
        )
      );

      if (!notificationSnapshot.empty) {
        notificationSnapshot.docs.forEach((docSnapshot) => {
          deleteDoc(doc(db, 'notifications', docSnapshot.id));
        });
      }

      setIsRequested(false);
      setIsLoading(false);
      // await sendNotification({
      //   title: "Deal canceled!",
      //   content: `@${authUser.username} canceled the deal.`,
      //   uid: userId,
      //   from: authUserId,
      //   type: "cancelDeal",
      //   time: Date.now(),
      // });
      toast({
        title: 'Deal canceled!',
        status: 'success',
        isClosable: true,
        position: 'top',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error canceling deal:', error);
      setIsLoading(false);

      toast({
        title: 'Failed to cancel deal',
        description:
          'An error occurred while canceling the deal. Please try again.',
        status: 'error',
        isClosable: true,
        position: 'top',
        duration: 5000,
      });
    }
  };

  return { isRequested, isLoading, requestUser, cancelDealUser, receivedDeals };
}

export function FollowButton({
  userId,
  authUserId,
  isMobile,
  updateFollowersCount,
}) {
  const { isFollowing, isLoading, followUser, unfollowUser } = useFollowUser(
    userId,
    authUserId
  );
  const { isFollowing: isFollowedBack } = useFollowUser(authUserId, userId); // Check if the target user follows the authenticated user
  const { followersCount } = useFollowersCount(userId); // Get the followers count of the target user
  const toast = useToast();

  const handleFollowUser = async () => {
    await followUser();
    updateFollowersCount(); // Update followers count after following a user
  };

  const handleUnfollowUser = async () => {
    await unfollowUser();
    updateFollowersCount(); // Update followers count after unfollowing a user
  };

  // Adjusted logic to display "Friends" only if both users follow each other
  const isFriends = isFollowing && isFollowedBack;
  const isFollowBack = isFollowedBack && !isFollowing;

  return (
    <>
      {isMobile ? (
        <Button
          colorScheme={
            isFriends
              ? 'green'
              : isFollowing
              ? 'gray'
              : isFollowBack
              ? 'blue'
              : 'blue'
          }
          onClick={isFollowing ? handleUnfollowUser : handleFollowUser}
          isLoading={isLoading}
          fontSize="10px"
          fontWeight={'200'}
          backgroundColor={'#6899fe'}
          color={'white'}
          border={'1px solid #B1C3DA'}
          borderRadius={'5px'}
          padding={'2.5px 15px'}
          _hover={{
            backgroundColor: '#527bd1',
          }}
        >
          {isFriends
            ? 'Friends'
            : isFollowing
            ? 'Unfollow'
            : isFollowBack
            ? 'Follow Back'
            : 'Follow'}
        </Button>
      ) : (
        <Button
          colorScheme={
            isFriends ? 'green' : isFollowing || isFollowBack ? 'gray' : 'blue'
          }
          isLoading={isLoading}
          fontSize="12.5px"
          fontWeight={'200'}
          backgroundColor={'#6899fe'}
          color={'white'}
          border={'1px solid #B1C3DA'}
          borderRadius={'5px'}
          padding={'5px 30px'}
          _hover={{
            backgroundColor: '#527bd1',
          }}
          onClick={isFollowing ? handleUnfollowUser : handleFollowUser}
        >
          {isFriends
            ? 'Friends'
            : isFollowing
            ? 'Unfollow'
            : isFollowBack
            ? 'Follow Back'
            : 'Follow'}
        </Button>
      )}
    </>
  );
}

export function FriendRequestButton({ userId, authUserId }) {
  const [requestState, setRequestState] = useState('none'); // 'none', 'requested', 'cancel'
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkFriendRequestStatus = async () => {
      // Check if there is an existing request from authUserId to userId
      const sentRequestDoc = doc(
        db,
        'users',
        authUserId,
        'sentRequests',
        userId
      );
      const sentRequestSnapshot = await getDoc(sentRequestDoc);

      if (sentRequestSnapshot.exists()) {
        setRequestState('cancel');
      } else {
        const receivedRequestDoc = doc(
          db,
          'users',
          userId,
          'receivedRequests',
          authUserId
        );
        const receivedRequestSnapshot = await getDoc(receivedRequestDoc);

        if (receivedRequestSnapshot.exists()) {
          setRequestState('requested');
        } else {
          setRequestState('none');
        }
      }
    };

    checkFriendRequestStatus();
  }, [userId, authUserId]);

  const handleSendFriendRequest = async () => {
    setIsLoading(true);
    // im going to adjust to make the pathways just making sure the structure is correct
    const sentRequestDoc = doc(db, 'users', authUserId, 'sentRequests', userId);
    const receivedRequestDoc = doc(
      db,
      'users',
      userId,
      'receivedRequests',
      authUserId
    );

    await updateDoc(sentRequestDoc, { status: 'pending' });
    await updateDoc(receivedRequestDoc, { status: 'pending' });

    setRequestState('cancel');
    setIsLoading(false);
  };

  const handleCancelFriendRequest = async () => {
    setIsLoading(true);
    // im going to adjust to make the pathways just making sure the structure is correct
    const sentRequestDoc = doc(db, 'users', authUserId, 'sentRequests', userId);
    const receivedRequestDoc = doc(
      db,
      'users',
      userId,
      'receivedRequests',
      authUserId
    );

    await deleteDoc(sentRequestDoc);
    await deleteDoc(receivedRequestDoc);

    setRequestState('none');
    setIsLoading(false);
  };

  return (
    <Button
      isLoading={isLoading}
      onClick={() => {
        if (requestState === 'none') {
          handleSendFriendRequest();
        } else if (requestState === 'cancel') {
          handleCancelFriendRequest();
        }
      }}
      colorScheme={requestState === 'cancel' ? 'red' : 'blue'}
    >
      {requestState === 'cancel'
        ? 'Cancel Friend Request'
        : 'Send Friend Request'}
    </Button>
  );
}

export function MessageRequestButton({
  userId,
  authUserId,
  isMobile,
  updateFollowersCount,
}) {
  const { isFollowing, isLoading, followUser, unfollowUser } = useFollowUser(
    userId,
    authUserId
  );
  const toast = useToast();
  const { isFollowing: isFollowedBack } = useFollowUser(authUserId, userId);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [message, setMessage] = useState('');
  const { sendNotification } = useNotifications();
  const { user: authUser } = useAuth();
  //const history = useHistory();

  const sendMessageRequest = async () => {
    try {
      const userRef = doc(db, 'users', userId);

      // Check if the user document exists
      const userSnap = await getDoc(userRef);
      const businessRef = doc(db, 'businesses', userId);

      // Check if the user document exists
      const businessSnap = await getDoc(businessRef);

      if (userSnap.exists()) {
        // Create a new collection named "requests" inside the user document
        const requestsCollectionRef = collection(userRef, 'requests');

        // Add a new document with the specified structure to the "requests" collection
        await addDoc(requestsCollectionRef, {
          message: message,
          from: authUserId,
        });

        await sendNotification({
          title: 'New Request',
          content: `@${authUser.username} sent you a request.`,
          uid: userId,
          from: authUserId,
          type: 'request',
          time: Date.now(),
        });

        toast({
          title: 'Request sent successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        onClose(); // Close the modal after a successful request
      } else if (businessSnap.exists()) {
        // Create a new collection named "requests" inside the user document
        const requestsCollectionRef = collection(businessRef, 'requests');

        // Add a new document with the specified structure to the "requests" collection
        await addDoc(requestsCollectionRef, {
          message: message,
          from: authUserId,
        });

        toast({
          title: 'Request sent successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        onClose(); // Close the modal after a successful request
      } else {
        console.error('User document does not exist for userId:', userId);

        toast({
          title: 'Error sending request',
          description: 'User document not found',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error sending request:', error);

      toast({
        title: 'Error sending request',
        description: 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const {
    isRequested,
    isLoading: dealLoading,
    requestUser,
  } = useDeal(userId, authUserId);

  const handleRequestDeal = async () => {
    await requestUser();
  };

  const handleFollowUser = async () => {
    await followUser();
    updateFollowersCount();
    onClose();
  };

  const handleUnfollowUser = async () => {
    await unfollowUser();
    updateFollowersCount();
  };

  const doNothing = async () => {
    // Empty function body
  };
  const isFriends = isFollowing && isFollowedBack;
  const isFollowBack = isFollowedBack && !isFollowing;
  return (
    <>
      {isMobile ? (
        <>
          {isFriends || isFollowBack ? (
            <Button
              pos="flex"
              onClick={() => {
                window.location.href = `${PROTECTED}/messages/${userId}`;
              }}
              colorScheme={
                isFriends || isFollowing || isFollowBack ? 'blue' : 'blue'
              }
              isLoading={isLoading}
              fontSize="10px"
              fontWeight={'200'}
              backgroundColor={'#6899fe'}
              color={'white'}
              border={'1px solid #B1C3DA'}
              borderRadius={'5px'}
              padding={'2.5px 15px'}
              _hover={{
                backgroundColor: '#527bd1',
              }}
            >
              Message
            </Button>
          ) : (
            <Button
              colorScheme={
                isFriends || isFollowing || isFollowBack ? 'blue' : 'blue'
              }
              isLoading={isLoading}
              onClick={isFollowBack ? doNothing : onOpen}
              fontSize="10px"
              fontWeight={'200'}
              backgroundColor={'#6899fe'}
              color={'white'}
              border={'1px solid #B1C3DA'}
              borderRadius={'5px'}
              padding={'2.5px 15px'}
              _hover={{
                backgroundColor: '#527bd1',
              }}
            >
              Request
            </Button>
          )}
        </>
      ) : (
        <>
          {isFriends || isFollowBack ? (
            <Button
              colorScheme={
                isFriends || isFollowing || isFollowBack ? 'blue' : 'blue'
              }
              onClick={() => {
                window.location.href = `${PROTECTED}/messages/${userId}`;
              }}
              isLoading={isLoading}
              fontSize="12.5px"
              fontWeight={'200'}
              backgroundColor={'#6899fe'}
              color={'white'}
              border={'1px solid #B1C3DA'}
              borderRadius={'5px'}
              padding={'5px 30px'}
              _hover={{
                backgroundColor: '#527bd1',
              }}
            >
              Message
            </Button>
          ) : (
            <Button
              colorScheme={
                isFriends || isFollowing || isFollowBack ? 'blue' : 'blue'
              }
              isLoading={isLoading}
              onClick={isFollowBack ? doNothing : onOpen}
              fontSize="12.5px"
              fontWeight={'200'}
              backgroundColor={'#6899fe'}
              color={'white'}
              border={'1px solid #B1C3DA'}
              borderRadius={'5px'}
              padding={'2.5px 15px'}
              _hover={{
                backgroundColor: '#527bd1',
              }}
            >
              Request
            </Button>
          )}
        </>
      )}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send a Request</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="You can only send one request. Write your request here..."
              size="sm"
              maxLength={300}
            />
          </ModalBody>
          <Text ml="6" size="sm">
            Characters remaining: {300 - message.length}
          </Text>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => {
                sendMessageRequest();
                onClose();
              }}
            >
              Send Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function FollowingModal({ isOpen, onClose, following }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Following</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <GetUsername userIds={following} />
        </ModalBody>
        <ModalFooter>
          {/* Add any additional footer content or buttons if needed */}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function FollowersModal({ isOpen, onClose, followers }) {
  const uniqueFollowers = Array.from(new Set(followers));
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Followers</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <GetUsername userIds={uniqueFollowers} />
        </ModalBody>
        <ModalFooter>
          {/* Add any additional footer content or buttons if needed */}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function MutualFollowersModal({
  isOpen,
  onClose,
  followers,
  following,
  currentUserId,
}) {
  // Compute mutual followers
  const mutualFollowers = followers.filter(
    (follower) => following?.includes(follower) && follower !== currentUserId
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Mutual Followers</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {mutualFollowers.length > 0 ? (
            <GetUsername userIds={mutualFollowers} />
          ) : (
            <Text>No mutual followers</Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

const MutualAvatar = ({ mutualID }) => {
  const { user, isLoading } = useUser(mutualID);
  if (isLoading) {
    return <div>Loading...</div>; // Or any loading indicator
  }

  if (!user) {
    return <div>User not found</div>; // Handle user not found scenario
  }

  // Assuming `user` has an `avatar` URL and a `username`
  return (
    <Avatarr
      size="sm"
      src={user.avatar}
      // Prevent pointer events if you want to disable clicking or interaction
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default function Profile({ followers }) {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { username } = useParams();

  const [id, setID] = useState(null);
  const { user, isLoading: userLoading } = useUsername(username);

  const [isProfileLocked, setProfileLocked] = useState(false); // New state for profile lock

  const [isFriend, setIsFriend] = useState(false); // New state for friend status
  const { isFollowing } = useFollowUser(user?.id, authUser?.id);
  const { isFollowing: isFollowedBack } = useFollowUser(authUser?.id, user?.id);
  const onClose = (updatedPortfolio) => {
    // Close the modal
    portfolioClose();
    // Refresh the page
    window.location.reload();
  };

  const {
    isOpen: portfolioOpen,
    onOpen: onPortfolioOpen,
    onClose: portfolioClose,
  } = useDisclosure();

  const { uploadFiles, isLoading: uploadLoading } = useUploadPortfolio();
  const [newFiles, setNewFiles] = useState([]);
  const [newDescription, setNewDescription] = useState('');
  const [newUrls, setNewUrls] = useState([]);
  const [files, setFiles] = useState([]);
  const [editingPortfolioIndex, setEditPortfolioIndex] = useState(false);
  const [subscribed, setSubscribed] = useState(null);

  const isFriends = isFollowing && isFollowedBack;
  const isFollowBack = isFollowedBack && !isFollowing;

  const [isMutualModalOpen, setIsMutualModalOpen] = useState(false);

  const handleOpenMutualModal = () => setIsMutualModalOpen(true);
  const handleCloseMutualModal = () => setIsMutualModalOpen(false);

  const postsRef = useRef(null);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const supportedFiles = Array.from(files).filter(
          (file) =>
            !file.deleted &&
            (file.type.startsWith('image/') ||
              file.type.startsWith('video/') ||
              file.type.startsWith('audio/'))
        );

        if (supportedFiles.length > 0) {
          const uploadedFiles = await uploadFiles(supportedFiles);
          const uploadedUrls = uploadedFiles.map((file) => file.url);
          setNewUrls((prevUrls) => [...prevUrls, ...uploadedUrls]);
          setNewFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);
          setFiles(uploadedFiles);
        }
      } catch (error) {
        console.error('Error uploading files:', error);
        // Handle error, show error message to the user, etc.
      }
    }
  };

  const handleDescriptionChange = (event) => {
    setNewDescription(event.target.value);
  };

  const handleEditPortfolio = (item, index) => {
    // setEditedDescription(portfolios[0]?.description || "");
    setEditPortfolioIndex(true);
    onEditOpen();
  };

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onCloseEditPortfolio,
  } = useDisclosure();

  const handleDeleteFileSelected = async (index) => {
    if (editingPortfolioIndex === true) {
      // Delete the file from storage and Firestore

      try {
        const fileToDelete = portfolios[0].ids[index];

        if (
          !fileToDelete.deleted &&
          fileToDelete.type !== 'application/octet-stream'
        ) {
          const fileTODeleteArr = { id: fileToDelete };
          await handleDeleteFile(fileTODeleteArr);
        }
      } catch (error) {
        console.error('Error deleting file:', error);

        return;
      }

      const updatedPortfolioo = [...portfolios];
      updatedPortfolioo[0].url.splice(index, 1);
      updatedPortfolioo[0].name.splice(index, 1);
      updatedPortfolioo[0].ids.splice(index, 1);
    } else {
      // Remove the file URL from newUrls
      setNewUrls((prevUrls) => {
        const updatedUrls = [...prevUrls];
        updatedUrls.splice(index, 1);
        return updatedUrls;
      });

      // Remove the file object from newFiles
      setNewFiles((prevFiles) => {
        const updatedFiles = [...prevFiles];
        updatedFiles.splice(index, 1);
        return updatedFiles;
      });
      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles];
        updatedFiles.splice(index, 1);
        return updatedFiles;
      });

      await handleDeleteFile(files[index]);
    }
  };

  const handleCreatePortfolio = () => {
    onPortfolioOpen();
  };

  const handleSavePortfolioItem = async () => {
    try {
      // Create a new portfolio item
      const newItem = {
        description: newDescription,
        url: newFiles.map((file) => file.url),
        name: newFiles.map((file) => file.name),
        ids: newFiles.map((file) => file.id),
      };

      // Update the portfolio with the new item
      const updatedPortfolio = [...portfolios, newItem];

      // Save the updated portfolio in the database
      if (updatedPortfolio) {
        await updatePortfolioInDatabase(updatedPortfolio);
        // setPortfolio(updatedPortfolio);
        toast({
          title: 'Portfolio saved',
          description: 'Your portfolio has been successfully saved.',
          status: 'success',
          position: 'top',
          duration: 5000,
          isClosable: true,
        });
      } else {
        console.error('Invalid portfolio data');
        toast({
          title: 'Error',
          description: 'An error occurred while saving your portfolio.',
          status: 'error',
          position: 'top',
          duration: 5000,
          isClosable: true,
        });
      }
      // Reset the form fields
      setNewDescription('');
      setNewUrls([]);
      setFiles([]);
      onClose(updatedPortfolio);
      setEditPortfolioIndex(null);
    } catch (error) {
      console.error('Error saving portfolio item:', error);
      // Handle error, show error message to the user, etc.
    }
  };

  const onCloseEdit = (updatedPortfolio) => {
    // Close the modal
    onCloseEditPortfolio();
    setEditPortfolioIndex(null);
    setNewFiles([]);
  };

  const handleDeletePortfolio = async () => {
    try {
      // Delete files in the portfolio
      await handleDeleteFiles(portfolios[0].ids);

      // Delete portfolio from Firestore
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        portfolio: '',
      });
      window.location.reload();

      // Optional: You can show a success message or redirect the user after deleting the portfolio
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      // Optional: You can show an error message if deleting the portfolio fails
    }
  };

  const [editedDescription, setEditedDescription] = useState('');

  const handleSaveEdit = () => {
    // Logic for saving the edited description
    try {
      const updatedPortfolioCopy = portfolios.map((item, index) => {
        item.url.push(
          ...(newFiles?.map((file) => file.url) || portfolios[0].url)
        );
        item.name.push(
          ...(newFiles?.map((file) => file.name) || portfolios[0].name)
        );
        item.ids.push(
          ...(newFiles?.map((file) => file.id) || portfolios[0].ids)
        );
        item.description = editedDescription || portfolios[0].description;
        return item;
      });

      updatePortfolioInDatabase(updatedPortfolioCopy);
      setEditPortfolioIndex(null);
      onCloseEdit(updatedPortfolioCopy);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while editing your portfolio.',
        status: 'error',
        position: 'top',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error updating portfolio:', error);
    }
  };

  const getFileType = async (url) => {
    try {
      const storage = getStorage(); // Initialize Firebase Storage

      const fileRef = ref(storage, url);
      const metadata = await getMetadata(fileRef);
      return metadata.contentType;
    } catch (error) {
      console.error('Error getting file type:', error);
      return null;
    }
  };

  const { isOpen: openPortfolio, onToggle } = useDisclosure();
  const toast = useToast();
  const [isPortfolioOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const getActiveSubscription = async (user) => {
    try {
      const snapshot = await getDocs(
        query(
          collection(
            db,
            user?.businessName ? 'businesses' : 'users',
            user?.id,
            'subscriptions'
          ),
          where('status', 'in', ['trialing', 'active'])
        )
      );

      if (snapshot.docs.length > 0) {
        const doc = snapshot.docs[0];
        return doc.data().status;
      } else {
        console.log('No active or trialing subscription found.');
        return null;
      }
    } catch (error) {
      console.error('Error getting active subscription:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getActiveSubscription(user);
        setSubscribed(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [user?.id]);

  useEffect(() => {
    async function fetchUserID() {
      try {
        const id = await getIDfromUsername(username);
        setID(id);
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    }

    fetchUserID();
  }, [username]);

  const {
    portfolio: portfolios,
    isLoading: portfolioLoading,
    updatePortfolioInDatabase,
    handleDeleteFile,
    handleDeleteFiles,
  } = usePortfolio(user?.id || id);

  useEffect(() => {
    if (user && user.id) {
      // Check if user and user.id are not null or undefined
      const userRef = doc(db, 'users', user.id);
      const businessRef = doc(db, 'businesses', user.id);
      if (!user.businessName) {
        const unsubscribeUser = onSnapshot(userRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            const storedProfileLock = userData?.isProfileLocked; // Use optional chaining here
            if (storedProfileLock !== undefined) {
              setProfileLocked(storedProfileLock);
            }
          }
        });
        return () => {
          unsubscribeUser();
        };
      } else {
        const unsubscribeBusiness = onSnapshot(businessRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const businessData = docSnapshot.data();
            const storedProfileLock = businessData?.isProfileLocked; // Use optional chaining here
            if (storedProfileLock !== undefined) {
              setProfileLocked(storedProfileLock);
            }
          }
        });
        return () => {
          unsubscribeBusiness();
        };
      }
    }
    return;
  }, [user]);

  useEffect(() => {
    let unsubscribe = () => {};

    if (user && user.id) {
      const userRef = doc(db, 'users', user.id);

      unsubscribe = onSnapshot(userRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setProfileLocked(userData.isProfileLocked);
        }
      });
    }

    return () => unsubscribe();
  }, [user, db]);

  const { posts, isLoading: postsLoading } = usePosts(id);
  const { isOpen, onOpen, onClose: onCloseModal } = useDisclosure();
  //const { user: authUser, isLoading: authLoading } = useAuth();
  const {
    count: followersCount,
    isLoading: followersLoading,
    updateFollowersCount,
  } = useFollowersCount(user?.id);
  var likeCount = 0;
  if (Array.isArray(posts)) {
    posts.forEach((post) => {
      if (Array.isArray(post.likes)) {
        likeCount += post.likes.length;
      }
    });
  }

  const handleToggleProfileLock = async () => {
    if (authUser.id === user.id) {
      const newProfileLockState = !isProfileLocked;
      setProfileLocked(newProfileLockState);

      try {
        // Update the profile lock state in the database
        const userRef = doc(db, 'users', user.id);
        const businessRef = doc(db, 'businesses', user.id);
        const userDocSnapshot = await getDoc(userRef);
        const businessDocSnapshot = await getDoc(businessRef);
        if (userDocSnapshot.exists()) {
          await updateDoc(
            userRef,
            { isProfileLocked: newProfileLockState },
            { merge: true }
          );
        } else if (businessDocSnapshot.exists()) {
          await updateDoc(
            businessRef,
            { isProfileLocked: newProfileLockState },
            { merge: true }
          );
        }
      } catch (error) {
        console.log('Error updating profile lock state:', error);
      }
    }
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const [isModalOpenFollowers, setIsModalOpenFollowers] = useState(false);
  const handleOpenModalFollowers = () => {
    setIsModalOpenFollowers(true);
  };

  const handleCloseModalFollowers = () => {
    setIsModalOpenFollowers(false);
  };
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { colorMode, toggleColorMode } = useColorMode();

  if (userLoading || postsLoading || followersLoading) return 'Loading...';
  const uniqueFollowers = Array.from(new Set(user?.followers));

  const handleTogglePrivacy = async () => {
    if (user && user.id) {
      const userRef = doc(db, 'users', user.id);

      try {
        await updateDoc(userRef, {
          isProfileLocked: !isProfileLocked,
        });
        console.log('Profile privacy updated successfully.');
      } catch (error) {
        console.error('Error updating profile privacy:', error);
      }
    }
  };

  const handleShowFollowers = () => {
    if (
      user.isProfileLocked &&
      authUser.id !== user.id &&
      !isFriends &&
      !isFollowBack
    ) {
      toast({
        title: 'Private Account',
        description: 'This user has a private account.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    } else {
      setIsModalOpenFollowers(true);
    }
  };

  const handleShowFollowing = () => {
    if (
      user.isProfileLocked &&
      authUser.id !== user.id &&
      !isFriends &&
      !isFollowBack
    ) {
      toast({
        title: 'Private Account',
        description: 'This user has a private account.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    } else {
      setIsModalOpen(true);
    }
  };

  const handleScrollToPosts = () => {
    if (postsRef.current) {
      const yOffset = -75; // Adjust this value to change the offset
      const y =
        postsRef.current.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const mutualFollowers =
    uniqueFollowers?.length > 0 && user?.following?.length > 0
      ? uniqueFollowers.filter(
          (follower) =>
            user?.following?.includes(follower) && follower !== authUser.id
        )
      : [];

  // Limit to first three mutual followers
  const firstThreeMutuals = mutualFollowers.slice(0, 3);

  if (user) {
    return (
      <>
        {!isMobile ? (
          <Box
            mt={'50px'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            width="100%"
          >
            <VStack
              spacing={6}
              justifyContent={'center'}
              alignItems={'center'}
              minW="container.lg"
            >
              <HStack
                justifyContent={'center'}
                alignItems={'flex-start'}
                gap={'20px'}
                mb={'10px'}
                ml={'75px'}
              >
                {/* VStack 1 - Profile DP, username, name, loc */}
                <Flex
                  direction={!isMobile ? 'column' : 'row'}
                  justifyContent={'center'}
                  alignItems={'center'}
                >
                  <Box position="relative" display="inline-block">
                    <Avatarr
                      src={user?.avatar}
                      height={'125px'}
                      width={'125px'}
                      user={user}
                      post={false}
                      mb={'10px'}
                    />
                    {subscribed && (
                      <Badge
                        position="absolute"
                        bottom={'10px'}
                        left={'85px'}
                        fontSize={'10px'}
                        padding={'3px 9px'}
                        textAlign={'center'}
                        backgroundColor="orange"
                        color={'white'}
                        zIndex="1" // Ensure the badge is above the avatar
                      >
                        PRO
                      </Badge>
                    )}
                  </Box>
                  <VStack
                    ml={isMobile ? 5 : '0'}
                    direction={'column'}
                    justifyContent={'center'}
                    alignItems={'center'}
                    gap={'2.5px'}
                  >
                    <Text fontSize="17.5px" fontWeight="700">
                      {user?.username}
                    </Text>
                    <Text fontSize="15px" fontWeight="400" color="black">
                      {user?.fullName}
                    </Text>

                    {/* User location */}
                    {user?.location && (
                      <Flex key={user?.location} align="flex-start">
                        <Image
                          src={LocationPin}
                          height={'15px'}
                          width={'10px'}
                        ></Image>
                        <Text
                          ml={2}
                          fontSize={isMobile ? '2xs' : '12.5px'}
                          fontWeight={'700'}
                          maxWidth={'150px'}
                          wordBreak={'normal'}
                        >
                          {user?.location !== ''
                            ? user?.location
                            : 'Everywhere'}
                        </Text>
                      </Flex>
                    )}

                    {/* Business location */}
                    {user?.locations?.flatMap((address, indexx) => {
                      if (address?.Addresses && indexx < 1) {
                        return address?.Addresses.map((location, index) => (
                          <Flex key={index} align="flex-start">
                            <Image
                              src={LocationPin}
                              height={'15px'}
                              width={'10px'}
                            ></Image>
                            <Text
                              ml={2}
                              fontSize={isMobile ? '2xs' : '12.5px'}
                              fontWeight={'700'}
                              maxWidth={'150px'}
                              wordBreak={'normal'}
                            >
                              {location.address !== ''
                                ? location.address
                                : 'Everywhere'}
                            </Text>
                          </Flex>
                        ));
                      } else if (indexx === user?.locations.length - 1) {
                        return <Text>...</Text>;
                      }
                    })}
                  </VStack>
                </Flex>

                {/* VStack 2 of Profile */}
                <VStack
                  display={'flex'}
                  flexDirection={'column'}
                  justifyContent={'center'}
                  alignItems={'center'}
                  mt={'30px'}
                >
                  {/* HStack 1 - Posts, Followers, Following */}
                  <HStack gap={'75px'}>
                    {/* Posts */}
                    <VStack
                      gap={0}
                      cursor={'pointer'}
                      _hover={{ color: '#6899FE' }}
                      onClick={() => handleScrollToPosts()}
                    >
                      <Text fontSize="12.5px" fontWeight={'700'}>
                        Posts
                      </Text>
                      <Text fontSize={'17.5px'} fontWeight={'400'}>
                        {posts && posts.length}
                      </Text>
                    </VStack>
                    {/* Followers */}
                    <VStack
                      gap={0}
                      align="center"
                      pl="5"
                      cursor={'pointer'}
                      onClick={() => {
                        handleShowFollowers();
                      }}
                      _hover={{ color: '#6899FE' }}
                    >
                      <Text fontSize="12.5px" fontWeight={'700'}>
                        Followers
                      </Text>
                      <Text fontSize={'17.5px'} fontWeight={'400'}>
                        {uniqueFollowers.length}
                      </Text>
                    </VStack>
                    {/* Following */}
                    <VStack
                      gap={0}
                      align="center"
                      pl="5"
                      cursor={'pointer'}
                      onClick={() => {
                        handleShowFollowing();
                      }}
                      _hover={{ color: '#6899FE' }}
                    >
                      <Text fontSize="12.5px" fontWeight={'700'}>
                        Following
                      </Text>
                      <Text fontSize={'17.5px'} fontWeight={'400'}>
                        {user?.following ? user?.following?.length : '0'}
                      </Text>
                    </VStack>
                  </HStack>

                  {/* PC: HStack 2 - Portfolio, Follow, Request, Message */}
                  <HStack>
                    <FollowingModal
                      isOpen={isModalOpen}
                      onClose={handleCloseModal}
                      following={user?.following}
                    />
                    <FollowersModal
                      isOpen={isModalOpenFollowers}
                      onClose={handleCloseModalFollowers}
                      followers={user?.followers}
                    />
                    <HStack align={'center'} mt="5" ml="3" mb="15" gap={'15px'}>
                      {/* Edit Profile */}
                      {!authLoading && authUser.id === user.id && (
                        <Button
                          onClick={onOpen}
                          fontSize="12.5px"
                          fontWeight={'200'}
                          backgroundColor={'#6899fe'}
                          color={'white'}
                          border={'1px solid #B1C3DA'}
                          borderRadius={'6px'}
                          padding={'5px 40px'}
                          _hover={{
                            backgroundColor: '#527bd1',
                          }}
                        >
                          Edit Profile
                        </Button>
                      )}
                      {/* Follow Button */}
                      {!authLoading && authUser.id !== user.id && (
                        <FollowButton
                          userId={user.id}
                          authUserId={authUser.id}
                          isMobile={isMobile}
                          updateFollowersCount={updateFollowersCount}
                          fontSize="12.5px"
                          fontWeight={'200'}
                          backgroundColor={'#6899fe'}
                          color={'white'}
                          border={'1px solid #B1C3DA'}
                          borderRadius={'5px'}
                          padding={'5px 30px'}
                          _hover={{
                            backgroundColor: '#527bd1',
                          }}
                        />
                      )}
                      {/* Message Button */}
                      {!authLoading && authUser.id !== user.id && (
                        <MessageRequestButton
                          userId={user.id}
                          authUserId={authUser.id}
                          isMobile={isMobile}
                          fontSize="12.5px"
                          fontWeight={'200'}
                          backgroundColor={'#6899fe'}
                          color={'white'}
                          border={'1px solid #B1C3DA'}
                          borderRadius={'5px'}
                          padding={'5px 30px'}
                          _hover={{
                            backgroundColor: '#527bd1',
                          }}
                        />
                      )}

                      {/* Logged in User Portfolio */}
                      {!authLoading &&
                        authUser.id === user.id &&
                        user?.portfolio && (
                          <Button
                            onClick={openModal}
                            fontSize="12.5px"
                            fontWeight={'200'}
                            backgroundColor={'white'}
                            color={'#6899FE'}
                            border={'3px solid #6899FE'}
                            borderRadius={'6px'}
                            padding={'5px 30px'}
                            _hover={{
                              backgroundColor: '#ebedf2',
                            }}
                          >
                            {!openPortfolio
                              ? 'Open Portfolio'
                              : 'Close Portfolio'}
                          </Button>
                        )}

                      {/* Other User Portfolio */}
                      {!authLoading &&
                        authUser.id !== user.id &&
                        user?.portfolio && (
                          <Button
                            onClick={openModal}
                            fontSize="12.5px"
                            fontWeight={'200'}
                            backgroundColor={'white'}
                            color={'#6899FE'}
                            border={'3px solid #6899FE'}
                            borderRadius={'6px'}
                            padding={'5px 30px'}
                            _hover={{
                              backgroundColor: '#ebedf2',
                            }}
                          >
                            {!openPortfolio
                              ? 'Open Portfolio'
                              : 'Close Portfolio'}
                          </Button>
                        )}
                    </HStack>

                    <Box
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                      }}
                    >
                      {portfolios && portfolios.length > 0 ? (
                        <>
                          <Modal isOpen={isPortfolioOpen} onClose={closeModal}>
                            <ModalOverlay />
                            <ModalContent
                              maxW="50vw"
                              maxH="80vh"
                              backgroundColor={'transparent'}
                              boxShadow={'none'}
                            >
                              <ModalBody>
                                <Center>
                                  <Wrap>
                                    <Button
                                      size={'sm'}
                                      variant="ghost"
                                      onClick={closeModal}
                                      position="absolute"
                                      top="5%"
                                      right="7"
                                      transform="translateY(-50%)"
                                      _hover={{ bg: 'whiteAlpha.500' }}
                                      zIndex="999"
                                    >
                                      <Icon as={CloseIcon} />
                                    </Button>
                                    {portfolios?.map(
                                      (item, index) =>
                                        authUser?.id === user?.id && (
                                          <ButtonGroup key={index} spacing="2">
                                            <Button
                                              size={'xs'}
                                              colorScheme="blue"
                                              backgroundColor={'#6899fe'}
                                              onClick={() =>
                                                handleEditPortfolio(item)
                                              }
                                            >
                                              Edit
                                            </Button>
                                            <Button
                                              size={'xs'}
                                              colorScheme="blue"
                                              backgroundColor={'#6899fe'}
                                              onClick={() =>
                                                handleDeletePortfolio()
                                              }
                                            >
                                              Delete Portfolio
                                            </Button>
                                          </ButtonGroup>
                                        )
                                    )}
                                    {portfolios?.map((item, index) => (
                                      <WrapItem key={index}>
                                        <Box>
                                          <PromiseRender
                                            urls={item?.url}
                                            getFileType={getFileType}
                                            name={item?.name}
                                          />
                                        </Box>
                                      </WrapItem>
                                    ))}
                                  </Wrap>
                                </Center>
                              </ModalBody>
                            </ModalContent>
                          </Modal>
                        </>
                      ) : authUser.username === username &&
                        !authUser.businessName &&
                        !isMobile ? (
                        <Button
                          onClick={handleCreatePortfolio}
                          fontSize="12.5px"
                          fontWeight={'200'}
                          backgroundColor={'white'}
                          color={'#6899FE'}
                          border={'4px solid #6899FE'}
                          borderRadius={'5px'}
                          padding={'5px 30px'}
                          _hover={{
                            backgroundColor: '#ebedf2',
                          }}
                        >
                          Create Portfolio
                        </Button>
                      ) : (
                        <></>
                      )}
                    </Box>

                    <Modal isOpen={portfolioOpen} onClose={portfolioClose}>
                      <ModalOverlay />
                      <ModalContent>
                        <ModalHeader>Create Portfolio Item</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                          <VStack spacing={4} align="start">
                            <FormControl>
                              <FormLabel>
                                Upload Image, Videos or Audios
                              </FormLabel>
                              <Input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                accept="image/*,audio/*,video/*"
                              />
                              {newFiles.map((file, index) => (
                                <Flex key={index} align="center" mt={2}>
                                  <Text>{file.name}</Text>
                                  <IconButton
                                    ml={2}
                                    aria-label="Delete File"
                                    icon={<DeleteIcon />}
                                    onClick={() =>
                                      handleDeleteFileSelected(index)
                                    }
                                  />
                                </Flex>
                              ))}
                            </FormControl>
                          </VStack>
                        </ModalBody>
                        <ModalFooter>
                          <Button
                            colorScheme="blue"
                            mr={3}
                            onClick={handleSavePortfolioItem}
                          >
                            Save
                          </Button>
                          <Button variant="ghost" onClick={onClose}>
                            Cancel
                          </Button>
                        </ModalFooter>
                      </ModalContent>
                    </Modal>

                    <Modal isOpen={isEditOpen} onClose={onCloseEdit}>
                      <ModalOverlay />
                      <ModalContent>
                        <ModalHeader>Edit Portfolio Item</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                          <FormControl>
                            <FormLabel>Uploaded Files</FormLabel>
                            {portfolios.map((por, index) => (
                              <Wrap key={index}>
                                {Array.isArray(por.name) ? (
                                  por.name.map((name, inde) => (
                                    <Flex key={inde} align="center" mt={2}>
                                      <Text>{name}</Text>
                                      <IconButton
                                        ml={2}
                                        aria-label="Delete File"
                                        icon={<DeleteIcon />}
                                        onClick={() =>
                                          handleDeleteFileSelected(inde)
                                        }
                                      />
                                    </Flex>
                                  ))
                                ) : (
                                  <Text>No names available</Text>
                                )}
                              </Wrap>
                            ))}
                            {newFiles.map((file, index) => (
                              <Flex key={index} align="center" mt={2}>
                                <Text>{file.name}</Text>
                                <IconButton
                                  ml={2}
                                  aria-label="Delete File"
                                  icon={<DeleteIcon />}
                                  onClick={() =>
                                    handleDeleteFileSelected(index)
                                  }
                                />
                              </Flex>
                            ))}
                          </FormControl>
                          <FormControl>
                            <FormLabel>Add Files</FormLabel>
                            <Input
                              type="file"
                              multiple
                              onChange={handleFileUpload}
                              accept="image/*,audio/*,video/*"
                            />
                          </FormControl>
                        </ModalBody>
                        <ModalFooter>
                          <Button
                            colorScheme="blue"
                            mr={3}
                            onClick={handleSaveEdit}
                          >
                            Save Changes
                          </Button>
                          <Button variant="ghost" onClick={onCloseEdit}>
                            Cancel
                          </Button>
                        </ModalFooter>
                      </ModalContent>
                    </Modal>
                  </HStack>

                  {/* HStack 3 - Bio */}
                  <HStack>
                    {/* PC Bio */}
                    {user?.bio && (
                      <Flex
                        align="center"
                        mt={'10px'}
                        mb={'30px'}
                        padding={'5px 10px'}
                        border={'1px solid #C4C9CF'}
                        borderRadius={'1px'}
                        rounded={'md'}
                        maxW={'500px'}
                        wordBreak={'normal'}
                      >
                        <Text
                          fontSize={isMobile ? 'xs' : '15px'}
                          fontWeight={'400'}
                        >
                          {user?.bio}
                        </Text>
                      </Flex>
                    )}
                  </HStack>

                  {/* VStack - Posts */}
                  <VStack
                    justifyContent={'center'}
                    alignItems={'center'}
                    ref={postsRef}
                  >
                    {!isProfileLocked ||
                    authUser.id === user.id ||
                    isFriends ||
                    isFollowBack ? (
                      <Box alignContent="center">
                        {posts && posts.length ? (
                          <PostsList posts={posts} />
                        ) : (
                          <Text>No posts found.</Text>
                        )}
                      </Box>
                    ) : (
                      <Box alignContent="center">
                        <Text>
                          This profile is private. Follow to see their posts.
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </VStack>

                {/* VStack 3 of Profile */}
                <VStack mt={'25px'}>
                  {/* User Roles n shit */}
                  {!isMobile && (
                    <VStack
                      align="start"
                      border={'1px solid #C4C9CF'}
                      borderRadius={'5px'}
                      padding={'15px'}
                      paddingRight={'50px'}
                      width={'250px'}
                      wordBreak={'normal'}
                    >
                      {user?.role && (
                        <Flex direction="row">
                          {user?.role && (
                            <>
                              <Text
                                fontSize={isMobile ? '2xs' : '12.5px'}
                                fontWeight={'700'}
                              >
                                Role:
                              </Text>
                              <Wrap ml="2">
                                <WrapItem key={user?.role}>
                                  <Text
                                    fontSize={isMobile ? '2xs' : '12.5px'}
                                    fontWeight={'400'}
                                  >
                                    {user?.role.toUpperCase()}
                                  </Text>
                                </WrapItem>
                              </Wrap>
                            </>
                          )}
                        </Flex>
                      )}

                      {user?.instrument && (
                        <Wrap direction="row">
                          {user?.instrument ? (
                            user?.instrument.length > 0 && (
                              <>
                                <Text
                                  fontSize={isMobile ? '2xs' : '12.5px'}
                                  fontWeight={'700'}
                                >
                                  Instruments:
                                </Text>
                                <Wrap ml="2">
                                  {user?.instrument.map((instrument, index) =>
                                    index < 3 ? (
                                      <WrapItem key={index}>
                                        <Text
                                          fontSize={isMobile ? '2xs' : '12.5px'}
                                          fontWeight={'400'}
                                        >
                                          {instrument.toUpperCase()}
                                        </Text>
                                      </WrapItem>
                                    ) : (
                                      index === user?.instrument.length - 1 && (
                                        <Text>...</Text>
                                      )
                                    )
                                  )}
                                </Wrap>
                              </>
                            )
                          ) : (
                            <></>
                          )}
                        </Wrap>
                      )}

                      {user?.genres ? (
                        user?.genres.length > 0 && (
                          <Flex direction="row">
                            <Text
                              fontSize={isMobile ? '2xs' : '12.5px'}
                              fontWeight={'700'}
                            >
                              Genres:{' '}
                            </Text>
                            <Wrap ml="2">
                              {user?.genres.map((genre, index) =>
                                index < 3 ? (
                                  <WrapItem key={index}>
                                    <Text
                                      fontSize={isMobile ? '2xs' : '12.5px'}
                                      fontWeight={'400'}
                                    >
                                      {genre.toUpperCase()}
                                    </Text>
                                  </WrapItem>
                                ) : (
                                  index === user?.genres.length - 1 && (
                                    <Text>...</Text>
                                  )
                                )
                              )}
                            </Wrap>
                          </Flex>
                        )
                      ) : (
                        <></>
                      )}

                      {user?.signed && (
                        <Flex direction="row">
                          {user?.signed && (
                            <>
                              <Text
                                fontSize={isMobile ? '2xs' : '12.5px'}
                                fontWeight={'700'}
                              >
                                Signed:
                              </Text>
                              <Wrap ml="2">
                                <Text
                                  fontSize={isMobile ? '2xs' : '12.5px'}
                                  fontWeight={'400'}
                                >
                                  {user?.signed ? 'Yes' : 'No'}
                                </Text>
                              </Wrap>
                            </>
                          )}
                        </Flex>
                      )}

                      {user?.languages &&
                        Array.isArray(user.languages) &&
                        user.languages.length > 0 && (
                          <Flex direction="row">
                            <>
                              <Text
                                fontSize={isMobile ? '2xs' : '12.5px'}
                                fontWeight={'700'}
                              >
                                Languages:
                              </Text>
                              <Wrap ml="2">
                                {user.languages.map((language, index) =>
                                  index < 3 ? (
                                    <WrapItem key={index}>
                                      <Text
                                        fontSize={isMobile ? '2xs' : '12.5px'}
                                        fontWeight={'400'}
                                      >
                                        {language.toUpperCase()}
                                      </Text>
                                    </WrapItem>
                                  ) : (
                                    index === user?.languages.length - 1 && (
                                      <Text>...</Text>
                                    )
                                  )
                                )}
                              </Wrap>
                            </>
                          </Flex>
                        )}
                    </VStack>
                  )}
                </VStack>
                <EditProfile isOpen={isOpen} onCloseModal={onCloseModal} />
              </HStack>
            </VStack>
          </Box>
        ) : (
          <Box
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            mt={'50px'}
          >
            <VStack>
              {/* VStack 1 - Profile DP, username, name, loc */}
              <Flex
                direction={'row'}
                justifyContent={'center'}
                alignItems={'center'}
                mr={'60px'}
              >
                <Box position="relative" display="inline-block">
                  <Avatarr
                    src={user?.avatar}
                    height={'75px'}
                    width={'75px'}
                    user={user}
                    post={false}
                    mb={'10px'}
                  />
                  {subscribed && (
                    <Badge
                      position="absolute"
                      bottom={'10px'}
                      left={'45px'}
                      fontSize={'8px'}
                      padding={'1px 6px'}
                      textAlign={'center'}
                      backgroundColor="orange"
                      color={'white'}
                      borderRadius={'3px'}
                      zIndex="1" // Ensure the badge is above the avatar
                    >
                      PRO
                    </Badge>
                  )}
                </Box>
                <VStack
                  ml={isMobile ? 5 : '0'}
                  direction={'column'}
                  justifyContent={'center'}
                  alignItems={'flex-start'}
                  gap={'2.5px'}
                >
                  <Text fontSize="17.5px" fontWeight="700">
                    {user?.username}
                  </Text>
                  <Text fontSize="15px" fontWeight="400" color="black">
                    {user?.fullName}
                  </Text>

                  {/* User location */}
                  {user?.location && (
                    <Flex key={user?.location} align="flex-start">
                      <Image
                        src={LocationPin}
                        height={'12.5px'}
                        width={'10px'}
                      ></Image>
                      <Text
                        ml={2}
                        fontSize={'10px'}
                        fontWeight={'700'}
                        maxWidth={'150px'}
                        wordBreak={'normal'}
                      >
                        {user?.location !== '' ? user?.location : 'Everywhere'}
                      </Text>
                    </Flex>
                  )}

                  {/* Business location */}
                  {user?.locations?.flatMap((address, indexx) => {
                    if (address?.Addresses && indexx < 1) {
                      return address?.Addresses.map((location, index) => (
                        <Flex key={index} align="flex-start">
                          <Image
                            src={LocationPin}
                            height={'15px'}
                            width={'10px'}
                          ></Image>
                          <Text
                            ml={2}
                            fontSize={isMobile ? '2xs' : '12.5px'}
                            fontWeight={'700'}
                            maxWidth={'150px'}
                            wordBreak={'normal'}
                          >
                            {location.address !== ''
                              ? location.address
                              : 'Everywhere'}
                          </Text>
                        </Flex>
                      ));
                    } else if (indexx === user?.locations.length - 1) {
                      return <Text>...</Text>;
                    }
                  })}
                </VStack>
              </Flex>
              {/* VStack 2 of Profile */}
              <VStack
                display={'flex'}
                flexDirection={'column'}
                justifyContent={'center'}
                alignItems={'center'}
              >
                {/* HStack 1 - Portfolio, Follow, Request, Message */}
                <HStack>
                  <FollowingModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    following={user?.following}
                  />
                  <FollowersModal
                    isOpen={isModalOpenFollowers}
                    onClose={handleCloseModalFollowers}
                    followers={user?.followers}
                  />
                  <HStack align={'center'} mt="5px" mb="5px" gap={'10px'}>
                    {/* Edit Profile */}
                    {!authLoading && authUser.id === user.id && (
                      <Button
                        onClick={onOpen}
                        fontSize="10px"
                        fontWeight={'200'}
                        backgroundColor={'#6899fe'}
                        color={'white'}
                        border={'1px solid #B1C3DA'}
                        borderRadius={'6px'}
                        padding={'2.5px 15px'}
                        _hover={{
                          backgroundColor: '#527bd1',
                        }}
                      >
                        Edit Profile
                      </Button>
                    )}
                    {/* Follow Button */}
                    {!authLoading && authUser.id !== user.id && (
                      <FollowButton
                        userId={user.id}
                        authUserId={authUser.id}
                        isMobile={isMobile}
                        updateFollowersCount={updateFollowersCount}
                        fontSize="10px"
                        fontWeight={'200'}
                        backgroundColor={'#6899fe'}
                        color={'white'}
                        border={'1px solid #B1C3DA'}
                        borderRadius={'5px'}
                        padding={'2.5px 15px'}
                        _hover={{
                          backgroundColor: '#527bd1',
                        }}
                      />
                    )}
                    {/* Message Button */}
                    {!authLoading && authUser.id !== user.id && (
                      <MessageRequestButton
                        userId={user.id}
                        authUserId={authUser.id}
                        isMobile={isMobile}
                        fontSize="10px"
                        fontWeight={'200'}
                        backgroundColor={'#6899fe'}
                        color={'white'}
                        border={'1px solid #B1C3DA'}
                        borderRadius={'5px'}
                        padding={'2.5px 15px'}
                        _hover={{
                          backgroundColor: '#527bd1',
                        }}
                      />
                    )}

                    {/* Logged in User Portfolio */}
                    {!authLoading &&
                      authUser.id === user.id &&
                      user?.portfolio && (
                        <Button
                          onClick={openModal}
                          fontSize="10px"
                          fontWeight={'200'}
                          backgroundColor={'white'}
                          color={'#6899FE'}
                          border={'3px solid #6899FE'}
                          borderRadius={'6px'}
                          padding={'2.5px 15px'}
                          _hover={{
                            backgroundColor: '#ebedf2',
                          }}
                        >
                          {!openPortfolio
                            ? 'Open Portfolio'
                            : 'Close Portfolio'}
                        </Button>
                      )}

                    {/* Other User Portfolio */}
                    {!authLoading &&
                      authUser.id !== user.id &&
                      user?.portfolio && (
                        <Button
                          onClick={openModal}
                          fontSize="10px"
                          fontWeight={'200'}
                          backgroundColor={'white'}
                          color={'#6899FE'}
                          border={'3px solid #6899FE'}
                          borderRadius={'6px'}
                          padding={'2.5px 15px'}
                          _hover={{
                            backgroundColor: '#ebedf2',
                          }}
                        >
                          {!openPortfolio
                            ? 'Open Portfolio'
                            : 'Close Portfolio'}
                        </Button>
                      )}
                  </HStack>

                  <Box
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    {portfolios && portfolios.length > 0 ? (
                      <>
                        <Modal isOpen={isPortfolioOpen} onClose={closeModal}>
                          <ModalOverlay />
                          <ModalContent
                            maxW="50vw"
                            maxH="80vh"
                            backgroundColor={'transparent'}
                            boxShadow={'none'}
                          >
                            <ModalBody>
                              <Center>
                                <Wrap>
                                  <Button
                                    size={'sm'}
                                    variant="ghost"
                                    onClick={closeModal}
                                    position="absolute"
                                    top="5%"
                                    right="7"
                                    transform="translateY(-50%)"
                                    _hover={{ bg: 'whiteAlpha.500' }}
                                    zIndex="999"
                                  >
                                    <Icon as={CloseIcon} />
                                  </Button>
                                  {portfolios.map(
                                    (item, index) =>
                                      authUser?.id === user?.id && (
                                        <ButtonGroup key={index} spacing="2">
                                          <Button
                                            size={'xs'}
                                            colorScheme="blue"
                                            backgroundColor={'#6899fe'}
                                            onClick={() =>
                                              handleEditPortfolio(item)
                                            }
                                          >
                                            Edit
                                          </Button>
                                          <Button
                                            size={'xs'}
                                            colorScheme="blue"
                                            backgroundColor={'#6899fe'}
                                            onClick={handleDeletePortfolio}
                                          >
                                            Delete Portfolio
                                          </Button>
                                        </ButtonGroup>
                                      )
                                  )}
                                  {portfolios.map((item, index) => (
                                    <WrapItem key={index}>
                                      <Box>
                                        {item && item.url && item.name ? (
                                          <PromiseRender
                                            urls={item.url}
                                            getFileType={getFileType}
                                            name={item.name}
                                          />
                                        ) : (
                                          <Text>Invalid Portfolio Item</Text>
                                        )}
                                      </Box>
                                    </WrapItem>
                                  ))}
                                </Wrap>
                              </Center>
                            </ModalBody>
                          </ModalContent>
                        </Modal>
                      </>
                    ) : authUser.username === username &&
                      !authUser.businessName ? (
                      <Button
                        onClick={handleCreatePortfolio}
                        fontSize="10px"
                        fontWeight={'200'}
                        backgroundColor={'white'}
                        color={'#6899FE'}
                        border={'4px solid #6899FE'}
                        borderRadius={'5px'}
                        padding={'2.5px 15px'}
                        _hover={{
                          backgroundColor: '#ebedf2',
                        }}
                      >
                        Create Portfolio
                      </Button>
                    ) : (
                      <></>
                    )}
                  </Box>

                  <Modal isOpen={portfolioOpen} onClose={portfolioClose}>
                    <ModalOverlay />
                    <ModalContent>
                      <ModalHeader>Create Portfolio Item</ModalHeader>
                      <ModalCloseButton />
                      <ModalBody>
                        <VStack spacing={4} align="start">
                          <FormControl>
                            <FormLabel>
                              Upload Image, Videos or Audios
                            </FormLabel>
                            <Input
                              type="file"
                              multiple
                              onChange={handleFileUpload}
                              accept="image/*,audio/*,video/*"
                            />
                            {newFiles.map((file, index) => (
                              <Flex key={index} align="center" mt={2}>
                                <Text>{file.name}</Text>
                                <IconButton
                                  ml={2}
                                  aria-label="Delete File"
                                  icon={<DeleteIcon />}
                                  onClick={() =>
                                    handleDeleteFileSelected(index)
                                  }
                                />
                              </Flex>
                            ))}
                          </FormControl>
                        </VStack>
                      </ModalBody>
                      <ModalFooter>
                        <Button
                          colorScheme="blue"
                          mr={3}
                          onClick={handleSavePortfolioItem}
                        >
                          Save
                        </Button>
                        <Button variant="ghost" onClick={onClose}>
                          Cancel
                        </Button>
                      </ModalFooter>
                    </ModalContent>
                  </Modal>

                  <Modal isOpen={isEditOpen} onClose={onCloseEdit}>
                    <ModalOverlay />
                    <ModalContent>
                      <ModalHeader>Edit Portfolio Item</ModalHeader>
                      <ModalCloseButton />
                      <ModalBody>
                        <FormControl>
                          <FormLabel>Uploaded Files</FormLabel>
                          {portfolios.map((por, index) => (
                            <Wrap key={index}>
                              {Array.isArray(por.name) ? (
                                por.name.map((name, inde) => (
                                  <Flex key={inde} align="center" mt={2}>
                                    <Text>{name}</Text>
                                    <IconButton
                                      ml={2}
                                      aria-label="Delete File"
                                      icon={<DeleteIcon />}
                                      onClick={() =>
                                        handleDeleteFileSelected(inde)
                                      }
                                    />
                                  </Flex>
                                ))
                              ) : (
                                <Text>No names available</Text>
                              )}
                            </Wrap>
                          ))}
                          {newFiles.map((file, index) => (
                            <Flex key={index} align="center" mt={2}>
                              <Text>{file.name}</Text>
                              <IconButton
                                ml={2}
                                aria-label="Delete File"
                                icon={<DeleteIcon />}
                                onClick={() => handleDeleteFileSelected(index)}
                              />
                            </Flex>
                          ))}
                        </FormControl>
                        <FormControl>
                          <FormLabel>Add Files</FormLabel>
                          <Input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            accept="image/*,audio/*,video/*"
                          />
                        </FormControl>
                      </ModalBody>
                      <ModalFooter>
                        <Button
                          colorScheme="blue"
                          mr={3}
                          onClick={handleSaveEdit}
                        >
                          Save Changes
                        </Button>
                        <Button variant="ghost" onClick={onCloseEdit}>
                          Cancel
                        </Button>
                      </ModalFooter>
                    </ModalContent>
                  </Modal>
                </HStack>

                {/* HStack 2 - Bio */}
                <HStack>
                  {/* PC Bio */}
                  {user?.bio && (
                    <Flex
                      align="center"
                      mt={'10px'}
                      mb={'10px'}
                      padding={'2.5px 10px'}
                      border={'1px solid #C4C9CF'}
                      borderRadius={'1px'}
                      rounded={'md'}
                      width={'90vw'}
                      wordBreak={'normal'}
                    >
                      <Text fontSize={'10px'} fontWeight={'400'}>
                        {user?.bio}
                      </Text>
                    </Flex>
                  )}
                </HStack>

                {/* HStack 3 - Posts, Followers, Following */}
                <HStack
                  justifyContent={'space-evenly'}
                  alignItems={'center'}
                  width={'100%'}
                  mb={'10px'}
                >
                  {/* Posts */}
                  <VStack
                    gap={0}
                    cursor={'pointer'}
                    _hover={{ color: '#6899FE' }}
                    onClick={() => handleScrollToPosts()}
                  >
                    <Text fontSize="10px" fontWeight={'700'}>
                      Posts
                    </Text>
                    <Text fontSize={'12.5px'} fontWeight={'400'}>
                      {posts && posts.length}
                    </Text>
                  </VStack>
                  {/* Followers */}
                  <VStack
                    gap={0}
                    align="center"
                    pl="5"
                    cursor={'pointer'}
                    onClick={() => {
                      handleShowFollowers();
                    }}
                    _hover={{ color: '#6899FE' }}
                  >
                    <Text fontSize="10px" fontWeight={'700'}>
                      Followers
                    </Text>
                    <Text fontSize={'12.5px'} fontWeight={'400'}>
                      {uniqueFollowers.length}
                    </Text>
                  </VStack>
                  {/* Following */}
                  <VStack
                    gap={0}
                    align="center"
                    pl="5"
                    cursor={'pointer'}
                    onClick={() => {
                      handleShowFollowing();
                    }}
                    _hover={{ color: '#6899FE' }}
                  >
                    <Text fontSize="10px" fontWeight={'700'}>
                      Following
                    </Text>
                    <Text fontSize={'12.5px'} fontWeight={'400'}>
                      {user?.following ? user?.following?.length : '0'}
                    </Text>
                  </VStack>
                </HStack>

                {/* HStack 4 - Roles */}
                {isMobile && (
                  <HStack
                    spacing={2}
                    align="start"
                    style={{
                      border: '1px solid #C4C9CF',
                      width: '90vw',
                    }}
                    rounded={'md'}
                    padding={2}
                    mb={'10px'}
                  >
                    <Flex direction="row" wrap="wrap">
                      {user?.role && (
                        <Flex direction="row" mr={2}>
                          <Text
                            fontSize={isMobile ? '2xs' : 'sm'}
                            fontWeight={'bold'}
                          >
                            Role:
                          </Text>
                          <Text
                            variant="subtle"
                            fontSize={isMobile ? '2xs' : 'xs'}
                            ml={1}
                          >
                            {user?.role.toUpperCase()}
                          </Text>
                        </Flex>
                      )}
                      {user?.instrument && user?.instrument.length > 0 && (
                        <Flex direction="row" mr={2}>
                          <Text
                            fontSize={isMobile ? '2xs' : 'sm'}
                            fontWeight={'bold'}
                          >
                            Instruments:
                          </Text>
                          <Wrap>
                            {user?.instrument.map((instrument, index) => (
                              <WrapItem key={index}>
                                <Text
                                  variant="subtle"
                                  fontSize={isMobile ? '2xs' : 'xs'}
                                  ml={1}
                                >
                                  {instrument.toUpperCase()}
                                </Text>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </Flex>
                      )}
                      {user?.genres && user?.genres.length > 0 && (
                        <Flex direction="row" mr={2}>
                          <Text
                            fontSize={isMobile ? '2xs' : 'sm'}
                            fontWeight={'bold'}
                          >
                            Genres:
                          </Text>
                          <Wrap>
                            {user?.genres.map((genre, index) => (
                              <WrapItem key={index}>
                                <Text
                                  variant="subtle"
                                  fontSize={isMobile ? '2xs' : 'xs'}
                                  ml={1}
                                >
                                  {genre.toUpperCase()}
                                </Text>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </Flex>
                      )}
                      {user?.signed && (
                        <Flex direction="row" mr={2}>
                          <Text
                            fontSize={isMobile ? '2xs' : 'sm'}
                            fontWeight={'bold'}
                          >
                            Signed:
                          </Text>
                          <Text
                            variant="subtle"
                            fontSize={isMobile ? '2xs' : 'xs'}
                            ml={1}
                          >
                            {user?.signed ? 'Yes' : 'No'}
                          </Text>
                        </Flex>
                      )}
                      {user?.languages &&
                        Array.isArray(user.languages) &&
                        user.languages.length > 0 && (
                          <Flex direction="row" mr={2}>
                            <Text
                              fontSize={isMobile ? '2xs' : 'sm'}
                              fontWeight={'bold'}
                            >
                              Languages:
                            </Text>
                            <Wrap>
                              {user.languages.map((language, index) => (
                                <WrapItem key={index}>
                                  <Text
                                    variant="subtle"
                                    fontSize={isMobile ? '2xs' : 'xs'}
                                    ml={1}
                                  >
                                    {language.toUpperCase()}
                                  </Text>
                                </WrapItem>
                              ))}
                            </Wrap>
                          </Flex>
                        )}
                    </Flex>
                  </HStack>
                )}

                {/* VStack - Posts */}
                <VStack
                  justifyContent={'center'}
                  alignItems={'center'}
                  ref={postsRef}
                >
                  {!isProfileLocked ||
                  authUser.id === user.id ||
                  isFriends ||
                  isFollowBack ? (
                    <Box alignContent="center" width={'100vw'}>
                      {posts && posts.length ? (
                        <PostsList posts={posts} />
                      ) : (
                        <Text>No posts found.</Text>
                      )}
                    </Box>
                  ) : (
                    <Box alignContent="center">
                      <Text>
                        This profile is private. Follow to see their posts.
                      </Text>
                    </Box>
                  )}
                </VStack>
              </VStack>
              <EditProfile isOpen={isOpen} onCloseModal={onCloseModal} />
            </VStack>
          </Box>
        )}
      </>
    );
  } else {
    return <PageNotFound />;
  }
}

// PC Mutuals
{
  /* <HStack mb={"10px"} cursor={"pointer"}>
  {authUser.id !== user.id && (
    <>
      {firstThreeMutuals.length > 0 ? (
        <Flex
          direction="row"
          justifyContent="center"
          alignItems="center"
          onClick={handleOpenMutualModal}
        >
          {mutualFollowers.length === 1 && (
            <Text
              cursor="pointer"
              color="blue.500"
              mr={"5px"}
              _hover={{
                textDecor: "underline",
              }}
            >
              {mutualFollowers.length} Mutual:
            </Text>
          )}
          {mutualFollowers.length > 1 && (
            <Text
              cursor="pointer"
              color="blue.500"
              mr={"5px"}
              _hover={{
                textDecor: "underline",
              }}
            >
              {mutualFollowers.length} Mutuals:
            </Text>
          )}
          <AvatarGroup max={3} size={"sm"} gap={"2px"}>
            {firstThreeMutuals.map((mutualID, index) => (
              <MutualAvatar key={index} mutualID={mutualID} />
            ))}
          </AvatarGroup>
        </Flex>
      ) : (
        <Text>No mutual followers</Text>
      )}
      <MutualFollowersModal
        isOpen={isMutualModalOpen}
        onClose={handleCloseMutualModal}
        followers={uniqueFollowers} // You need to have these states ready
        following={user?.following}
        currentUserId={authUser.id}
      />{" "}
    </>
  )}
</HStack> */
}

// Mobile Mutuals
{
  /* HStack 4 - Mutuals */
}
{
  /* <HStack mb={"10px"} cursor={"pointer"}>
{authUser.id !== user.id && (
  <>
    {firstThreeMutuals.length > 0 ? (
      <Flex
        direction="row"
        justifyContent="center"
        alignItems="center"
        onClick={handleOpenMutualModal}
      >
        {mutualFollowers.length === 1 && (
          <Text
            cursor="pointer"
            color="blue.500"
            mr={"5px"}
            _hover={{
              textDecor: "underline",
            }}
          >
            {mutualFollowers.length} Mutual:
          </Text>
        )}
        {mutualFollowers.length > 1 && (
          <Text
            cursor="pointer"
            color="blue.500"
            mr={"5px"}
            _hover={{
              textDecor: "underline",
            }}
          >
            {mutualFollowers.length} Mutuals:
          </Text>
        )}
        <AvatarGroup max={3} size={"sm"} gap={"2px"}>
          {firstThreeMutuals.map((mutualID, index) => (
            <MutualAvatar key={index} mutualID={mutualID} />
          ))}
        </AvatarGroup>
      </Flex>
    ) : (
      <Text>No mutual followers</Text>
    )}
    <MutualFollowersModal
      isOpen={isMutualModalOpen}
      onClose={handleCloseMutualModal}
      followers={uniqueFollowers} // You need to have these states ready
      following={user?.following}
      currentUserId={authUser.id}
    />{" "}
  </>
)}
</HStack> */
}
