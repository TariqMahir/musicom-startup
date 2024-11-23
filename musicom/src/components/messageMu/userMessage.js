import {
  AvatarBadge,
  Box,
  Divider,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  useColorMode,
  Avatar,
  useBreakpointValue,
  InputRightElement,
  Tooltip,
  Badge,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import {
  FiChevronLeft,
  FiLink,
  FiMic,
  FiMinimize,
  FiPhone,
  FiSearch,
  FiSmile,
  FiVideo,
  FiX,
  FiMoreVertical,
} from 'react-icons/fi';
import { BsChevronDown } from 'react-icons/bs';
import { FaFileAudio, FaPaperPlane } from 'react-icons/fa';
import Message from './message';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useDispatch } from 'react-redux';
import { ToggleSidebar, UpdateSidebarType } from './redux/slices/app';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from 'lib/firebase';
import { useAuth } from 'hooks/auth';
import { useUser } from 'hooks/users';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from 'lib/firebase';

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

const ChatInput = ({
  setOpenPicker,
  messageToSend,
  setMessage,
  handleSendMessage,
}) => {
  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [isPremiumUser, setSubscribed] = useState(null);
  const { user } = useAuth();

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
  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && messageToSend.trim() !== '') {
      handleSendMessage({
        type: 'msg',
        subtype: '',
      });
    }
  };
  const [selectedFile, setSelectedFile] = useState(null);
  const uploadAndSendMessage = async () => {
    if (selectedFile) {
      const fileMimeType = selectedFile.type;
      let subtype = 'doc'; // Default subtype
      if (
        fileMimeType.startsWith('image/') ||
        fileMimeType.startsWith('video/') ||
        fileMimeType.startsWith('audio/')
      ) {
        subtype = 'img'; // Set subtype to "media" for images, videos, and audio files
      }

      const storageRef = ref(
        storage,
        `filesOfChat/${user?.id}/` + selectedFile.name
      );
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // You can add code here to show upload progress
        },
        (error) => {
          console.error('Error uploading file:', error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Send structured message
          handleSendMessage({
            type: 'msg',
            subtype: subtype,
            content: downloadURL,
            //fileName: selectedFile.name
          });

          setSelectedFile(null); // Clear the selected file
        }
      );
    } else {
      // Send text message as usual
      handleSendMessage({
        type: 'msg',
        subtype: '',
        content: messageToSend,
      });
    }
  };
  const [fileSizeError, setFileSizeError] = useState('');

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const maxSizeForFreeUser = 50 * 1000000; // 50 MB
      if (!isPremiumUser && file.size > maxSizeForFreeUser) {
        setFileSizeError('File size exceeds the limit for free users.');
        setSelectedFile(file);
        return;
      }

      setFileSizeError('');
      setSelectedFile(file);
    }
  };

  return (
    <InputGroup>
      <InputLeftElement borderRight="0.5px #9F9F9F" >
        <IconButton
          backgroundColor={'transparent'}
          icon={<FiLink color="#6899FE"/>}
          size={isMobile ? 'lg' : 'lg'}
          onClick={() => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = isPremiumUser
              ? '*'
              : 'image/*, video/*, audio/*';
            // console.log(fileInput);
            fileInput.onchange = handleFileChange;
            fileInput.click();
          }}
          _hover={{ backgroundColor: "transparent" }}
        />
        {isPremiumUser && (
          <Badge
            position="absolute"
            bottom="0"
            left="2"
            fontSize={'3xs'}
            backgroundColor="orange"
            color={'white'}
            zIndex="1"
          >
            PRO
          </Badge>
        )}
      </InputLeftElement>
      <Input
        type="text"
        placeholder={
          selectedFile
            ? fileSizeError
              ? fileSizeError
              : `Send file: ${selectedFile.name}`
            : 'Write a message...'
        }
        isDisabled={selectedFile ? true : false}
        value={messageToSend}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        focusBorderColor="transparent"
        backgroundColor={colorMode === 'light' ? 'gray.200' : 'whiteAlpha.200'}
        ml="5px"
      />
      <InputRightElement width={isMobile ? '40px' : 'auto'}>
        <Stack direction="row" spacing={0}>
          {selectedFile && (
            <IconButton
              backgroundColor={'transparent'}
              icon={<FiX color="#6899FE" />}
              size={isMobile ? 'sm' : 'md'}
              onClick={() => {
                setSelectedFile(null);
              }}
            />
          )}
          <IconButton
            backgroundColor={'transparent'}
            icon={<FaPaperPlane color="#6899FE"/>}
            isDisabled={fileSizeError}
            size={isMobile ? 'lg' : 'lg'}
            onClick={uploadAndSendMessage}
          />
        </Stack>
      </InputRightElement>
    </InputGroup>
  );
};

const UserMessage = ({ setUserPressed, userPressed }) => {
  const { colorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [openPicker, setOpenPicker] = useState(false);
  const dispatch = useDispatch();
  const handleToggleSidebar = () => {
    dispatch(ToggleSidebar());
    dispatch(UpdateSidebarType('CONTACT'));
  };

  const [history, setHistory] = useState([]);
  const { user, isLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const markMessagesAsRead = async (chatId) => {
    // Get all unread messages for the chat
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const unreadQuery = query(messagesRef, where('unread', '==', true));
    const unreadSnapshot = await getDocs(unreadQuery);

    const batch = writeBatch(db);

    // Mark each message as read
    unreadSnapshot.forEach((doc) => {
      batch.update(doc.ref, { unread: false });
    });

    // Commit the batch update
    await batch.commit();

    // Reset the unread count
    setUnreadCount(0);
  };

  useEffect(() => {
    // New code to listen for unread messages
    const userRef = user && doc(db, 'users', user.id);
    if (userRef && userPressed) {
      const chatsRef = collection(userRef, 'chats');
      const chatRef = doc(chatsRef, userPressed);
      const messagesRef = collection(chatRef, 'messages');
      const unreadQuery = query(messagesRef, where('unread', '==', true));

      const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
        // Update the unread count with the number of documents
        setUnreadCount(snapshot.size);
      });

      // Call the function to mark messages as read when the chat is opened
      markMessagesAsRead(userPressed);

      return () => unsubscribe();
    }
  }, [user, userPressed]);

  useEffect(() => {
    if (!user || !userPressed) return; // Check if userPressed exists
    const userRef = doc(db, user?.fullName ? 'users' : 'businesses', user?.id);
    const chatsCollectionRef = collection(userRef, 'chats');
    const docRef = doc(chatsCollectionRef, userPressed);
    const timestampCollectionRef = collection(docRef, 'timestamp');
    // Create an object to store chat history for each chat
    const chatHistory = {};

    // Create an unsubscribe function to stop listening when the component unmounts
    const unsubscribe = onSnapshot(timestampCollectionRef, (querySnapshot) => {
      querySnapshot.forEach((chatDoc) => {
        const chatId = chatDoc.id;

        // Listen for changes in the timestamp subcollection
        onSnapshot(timestampCollectionRef, (timestampSnapshot) => {
          const chatDataList = [];
          timestampSnapshot.forEach((timestampDoc) => {
            // Get the entire data object from each timestamp subcollection document
            const timestamp = timestampDoc.data();

            chatDataList.push({ ...timestamp, chatId });
          });

          // Update the state with the combined chat history
          setHistory(chatDataList);
        });
      });
    });

    // Return the unsubscribe function to stop listening when the component unmounts
    return () => {
      unsubscribe();
    };
  }, [user, userPressed]);

  const { user: userr, isLoading: isLoadingUserr } = useUser(userPressed);

  const [messageToSend, setMessage] = useState('');
  const sendMessage = async (
    senderRef,
    receiverRef,
    messageToSend,
    subtype,
    content
  ) => {
    try {
      const timestamp = Date.now().toString();

      // Create references to sender's and receiver's chats
      const senderChatsRef = collection(senderRef, 'chats');
      const receiverChatsRef = collection(receiverRef, 'chats');

      // Create references to sender's and receiver's chat documents
      const senderChatRef = doc(senderChatsRef, receiverRef.id);
      const receiverChatRef = doc(receiverChatsRef, senderRef.id);

      // Check if the chat documents exist
      const senderChatDoc = await getDoc(senderChatRef);
      const receiverChatDoc = await getDoc(receiverChatRef);

      // Create chat documents if they don't exist
      if (!senderChatDoc.exists()) {
        await setDoc(senderChatRef, {
          test: 'test',
        });
      }

      if (!receiverChatDoc.exists()) {
        await setDoc(receiverChatRef, {
          test: 'test',
        });
      }

      // Create references to sender's and receiver's timestamp collections
      const senderTimestampRef = collection(senderChatRef, 'timestamp');
      const receiverTimestampRef = collection(receiverChatRef, 'timestamp');

      // Create references to sender's and receiver's timestamp documents
      const senderTimestampDocRef = doc(senderTimestampRef, timestamp);
      const receiverTimestampDocRef = doc(receiverTimestampRef, timestamp);

      const senderMessageData = {
        message: messageToSend ? messageToSend : content,
        type: 'msg',
        subtype:
          messageToSend.includes('http') || messageToSend.includes('www.')
            ? 'link'
            : subtype
            ? subtype
            : '',
        incoming: false,
        outgoing: true,
        unread: false,
        date: serverTimestamp(),
      };

      const receiverMessageData = {
        message: content ? content : messageToSend,
        type: 'msg',
        subtype:
          messageToSend.includes('http') || messageToSend.includes('www.')
            ? 'link'
            : subtype
            ? subtype
            : '',
        incoming: true,
        outgoing: false,
        unread: true,
        date: serverTimestamp(),
      };

      // Send the message from the sender to the receiver
      await setDoc(senderTimestampDocRef, senderMessageData);
      await setDoc(receiverTimestampDocRef, receiverMessageData);
    } catch (error) {
      console.error('Error sending message: ', error);
      throw error;
    }
  };

  const handleSendMessage = async ({ subtype, content }) => {
    if (messageToSend.trim() !== '' || content !== '') {
      try {
        const senderRef = user.businessName
          ? doc(db, 'businesses', user.id)
          : doc(db, 'users', user.id);

        const userPressedBusinessRef = doc(db, 'businesses', userPressed);
        const userPressedUserRef = doc(db, 'users', userPressed);

        const userPressedDocBusiness = await getDoc(userPressedBusinessRef);
        const userPressedDocUser = await getDoc(userPressedUserRef);

        let receiverRef = null;

        if (userPressedDocBusiness.data()) {
          receiverRef = userPressedDocBusiness.ref;
        } else if (userPressedDocUser.data()) {
          receiverRef = userPressedDocUser.ref;
        } else {
          console.error(
            "UserPressed not found in 'businesses' or 'users' collection."
          );
          return; // Exit early if the recipient doesn't exist
        }

        await sendMessage(
          senderRef,
          receiverRef,
          messageToSend,
          subtype,
          content
        );

        // Clear the input field after sending the message
        setMessage('');
      } catch (error) {
        console.error('Error handling send message: ', error);
      }
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(!isSearching);
    setSearchQuery('');
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // TO DO: implement search functionality here
    console.log('Search query:', searchQuery);
  };

  return (
    <Box
      position={'relative'}
      height={isMobile ? '100%' : '100%'}
      width={isMobile ? '100vw' : '70%'}
      backgroundColor={'transparent'}
      borderLeft="1px solid #E2E8F0"
      borderRight="1px solid #E2E8F0"
      borderTop={ isMobile ? "auto" : "1px solid #E2E8F0"}
    >
      {userPressed ? (
        <>
          {/* Chat Header */}
          <Box
            width={'100%'}
            backgroundColor={'#transparent'}
            p={2}
            borderBottom="1px solid #E2E8F0"
            height={'10%'}
            borderTop="1px solid #E2E8F0"
          >
            <Stack
              alignItems={'center'}
              direction={'row'}
              justifyContent={'space-between'}
              width={'100%'}
              height={'100%'}
            >
              <Stack direction={'row'} spacing={2} mb={-2}>
                <IconButton
                  backgroundColor={'transparent'}
                  icon={<FiChevronLeft color="#6899FE"/>}
                  size="lg"
                  onClick={() => {
                    setUserPressed(null);
                  }}
                  _hover={{ backgroundColor: "transparent" }}
                  mr={-1}
                />
                <Box >
                  <Avatar
                    size={ isMobile ? "md" : "sm" }
                    src={userr?.avatar}
                    mb={isMobile ? 1 : 0}
                  >
                    {/* <AvatarBadge boxSize="1.25em" bg="green.500" /> */}
                  </Avatar>
                </Box>
                <Stack spacing={0.2}>
                  <Text
                    fontSize={isMobile ? 'md' : 'lg'}
                    mt={isMobile ? 0.5 : 0}
                    ml={1}
                    as="b"
                  >
                    {userr?.fullName
                      ? userr.fullName
                      : userr?.businessName
                      ? userr.businessName
                      : 'Error'}
                  </Text>
                  <Text
                    fontSize={isMobile ? 'sm' : 'md'}
                    ml={1}
                  >
                    @{userr?.username}
                  </Text>
                  {/* <Text fontSize={isMobile ? "2xs" : "sm"} variant={"caption"}>
                    Online
                  </Text> */}
                </Stack>
              </Stack>
              <Stack direction={'row'} alignItems={'center'} spacing={3}>
                {isSearching && (
                  <Box flexDirection={'row'}>
                    <Input
                      type="text"
                      value={searchQuery}
                      width={'auto'}
                      onChange={handleSearchInputChange}
                      placeholder="Search..."
                      color="black"
                      fontSize={12}
                      ml={-1}
                      height={"6"}
                    />
                  </Box>
                )}
                <Box>
                <IconButton
                  backgroundColor={'transparent'}
                  icon={isSearching ? <FiX color="grey" /> : <FiSearch color="grey" />}
                  size={isMobile ? 'sm' : 'md'}
                  onClick={() => {
                    handleSearch();
                  }}
                  _hover={{ backgroundColor: "transparent" }}
                />
                <IconButton
                  backgroundColor={'transparent'}
                  icon={<FiMoreVertical color="#6899FE" />} // Add the dots icon here
                  size={isMobile ? 'sm' : 'md'}
                  onClick={handleToggleSidebar}
                  _hover={{ backgroundColor: "transparent" }}
                />
                </Box>
              </Stack>
            </Stack>
          </Box>

          {/* Chat Message */}
          <Box width={'100%'} height={'80%'} overflowY="auto">
            {searchQuery ? (
              <Message
                menu={true}
                history={history.filter((el) => {
                  const text = el.message.toLowerCase();
                  return text.includes(String(searchQuery).toLowerCase());
                })}
                user={user}
                searchQuery={searchQuery}
              />
            ) : (
              <Message menu={true} history={history} user={user} />
            )}
          </Box>

          {/* Chat Footer */}
          <Box
            p={2}
            height={'10%'}
            width={'100%'}
            backgroundColor={'transparent'}
          >
            <Stack direction={'row'} alignItems={'center'} spacing={3}>
              <Stack width={'100%'}>
                {/* <Box
                  display={openPicker ? "inline" : "none"}
                  zIndex={10}
                  position={"absolute"}
                  right={0}
                  bottom={81}
                >
                  <Picker
                    theme="gray.300"
                    data={data}
                    onEmojiSelect={console.log}
                  />
                </Box> */}
                <ChatInput
                  setOpenPicker={setOpenPicker}
                  messageToSend={messageToSend}
                  setMessage={setMessage}
                  handleSendMessage={handleSendMessage}
                />
              </Stack>
            </Stack>
          </Box>
        </>
      ) : (
        <></>
      )}
    </Box>
  );
};

export default UserMessage;
