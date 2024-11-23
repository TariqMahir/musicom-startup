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
  useToast,
  Flex,
  Button,
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
} from 'firebase/firestore';
import { db } from 'lib/firebase';
import { useAuth } from 'hooks/auth';
import { useUser } from 'hooks/users';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from 'lib/firebase';
import { AvatarGroup } from '@chakra-ui/react';
import GroupInfo from './groupInfo';

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
    console.log('test');
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
        `filesOfChat/${user?.id}/` + selectedFile.name,
        console.log('filesOfChat/${user?.id}' + selectedFile.name)
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

          console.log('handle send message');
          // Send structured message
          handleSendMessage(
            {
              type: 'msg',
              subtype: subtype,
              content: downloadURL,
              //fileName: selectedFile.name
            },
            console.log('message sent')
          );

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
      console.log('the file');
      setFileSizeError('');
      setSelectedFile(file);
    }
  };

  return (
    <InputGroup>
      <InputLeftElement borderRight="0.5px solid #9F9F9F">
        <IconButton
          backgroundColor={'transparent'}
          icon={<FiLink color="#6899FE" />}
          size={isMobile ? 'lg' : 'lg'}
          onClick={() => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = isPremiumUser
              ? '*'
              : 'image/*, video/*, audio/*';
            fileInput.onchange = handleFileChange;
            fileInput.click();
          }}
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
            icon={<FaPaperPlane color="#6899FE" />}
            isDisabled={fileSizeError}
            size={isMobile ? 'lg' : 'lg'}
            onClick={uploadAndSendMessage}
          />
        </Stack>
      </InputRightElement>
    </InputGroup>
  );
};

const MutualAvatar = ({ mutualID }) => {
  const { user, isLoading } = useUser(mutualID);
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (isLoading) {
    return <div>Loading...</div>; // Or any loading indicator
  }

  if (!user) {
    return <div>User not found</div>; // Handle user not found scenario
  }

  // Assuming `user` has an `avatar` URL and a `username`
  return (
    <AvatarGroup>
      <Avatar
        size={isMobile ? 'md' : 'sm'}
        src={user.avatar}
        // Prevent pointer events if you want to disable clicking or interaction
        style={{ pointerEvents: 'none' }}
      />
    </AvatarGroup>
  );
};

const UserGroup = ({ groupId, onBack, setShowGroupInfo }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [messageToSend, setMessageToSend] = useState('');
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupName, setGroupName] = useState('');
  const isMobile = useBreakpointValue({ base: true, md: false });
  const dispatch = useDispatch();
  const [groupMembers, setGroupMembers] = useState([]);

  // Fetch messages for the selected group
  useEffect(() => {
    if (!groupId) return;

    const messagesRef = collection(db, 'groups', groupId, 'messages');
    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroupMessages(messages.sort((a, b) => a.createdAt - b.createdAt));
    });

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    const getGroupName = async () => {
      try {
        const messagesRef = doc(collection(db, 'groups'), groupId);
        const name = await getDoc(messagesRef);
        setGroupName(name.data().groupName);
        setGroupMembers(name.data().members);
      } catch (error) {
        console.error('Error getting group name:', error);
        throw error;
      }
    };

    getGroupName();
  }, [groupId]);

  const sendMessage = async (
    groupId,
    userId,
    messageToSend,
    subtype = '',
    content = ''
  ) => {
    try {
      const timestamp = Date.now().toString();
      const groupMessagesRef = collection(db, 'groups', groupId, 'messages');
      const messageData = {
        sentBy: userId,
        message: messageToSend ? messageToSend : content,
        type: 'msg',
        subtype: subtype,
        createdAt: serverTimestamp(),
      };
      await addDoc(groupMessagesRef, messageData);
    } catch (error) {
      console.error('Error sending message to group: ', error);
      throw error;
    }
  };

  const handleSendMessage = async ({ subtype, content }) => {
    const message = messageToSend ? messageToSend : content;
    if (!message || !groupId) return;

    try {
      await sendMessage(groupId, user?.id, messageToSend, subtype, content);
      setMessageToSend('');
    } catch (error) {
      toast({
        title: 'Failed to send message',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleToggleSidebar = () => {
    dispatch(ToggleSidebar());
    dispatch(UpdateSidebarType('CONTACT'));
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
      height={'100%'}
      width={isMobile ? '100%' : '150%'}
      backgroundColor={'transparent'}
      zIndex={1}
    >
      {/* Chat Header */}
      <Box
        width={'100%'}
        backgroundColor={'#transparent'}
        p={2}
        borderBottom="1px solid #E2E8F0"
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
              icon={<FiChevronLeft color="#6899FE" />}
              onClick={onBack}
              mr={-1}
              size="lg"
              _hover={{ backgroundColor: 'transparent' }}
            />
            <Box onClick={handleToggleSidebar}>
              {/* <Avatar
                size={isMobile ? "sm" : "sm"}
                src={""}
                mb={isMobile ? 1 : 0}
                onClick={() => setShowGroupInfo(true)}
                cursor="pointer"
              >
              </Avatar> */}

              <AvatarGroup
                size={isMobile ? 'xl' : 'sm'}
                max={8}
                onClick={() => setShowGroupInfo(true)}
                cursor="pointer"
                mb={isMobile ? 1 : 0}
              >
                {groupMembers.slice(0, 3).map((member, index) => (
                  <MutualAvatar key={index} mutualID={member} />
                ))}
                {groupMembers.length > 3 && (
                  <Text>+{(groupMembers.length - 3).toString()}</Text>
                )}
              </AvatarGroup>
            </Box>
            <Stack spacing={0.2}>
              <Text
                fontSize={isMobile ? 'md' : 'lg'}
                mb={1}
                mt={isMobile ? 1 : 0.5}
                ml={1}
                as="b"
                onClick={() => setShowGroupInfo(true)}
                cursor="pointer"
              >
                {groupName}
              </Text>
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
                  height={'6'}
                />
              </Box>
            )}
            <IconButton
              backgroundColor={'transparent'}
              icon={
                isSearching ? <FiX color="grey" /> : <FiSearch color="grey" />
              }
              size={isMobile ? 'sm' : 'md'}
              onClick={() => {
                handleSearch();
              }}
              _hover={{ backgroundColor: 'transparent' }}
            />
            <IconButton
              backgroundColor={'transparent'}
              icon={<FiMoreVertical color="#6899FE" />} // Add the dots icon here
              size={isMobile ? 'sm' : 'md'}
              onClick={handleToggleSidebar}
              _hover={{ backgroundColor: 'transparent' }}
            />
          </Stack>
        </Stack>
      </Box>

      <Box width={'100%'} height={'80%'} overflowY="auto">
        {searchQuery ? (
          <Message
            menu={true}
            history={groupMessages.filter((el) => {
              const text = el.message.toLowerCase();
              return text.includes(String(searchQuery).toLowerCase());
            })}
            user={user}
            searchQuery={searchQuery}
          />
        ) : (
          <Message menu={true} history={groupMessages} user={user} />
        )}
      </Box>

      {/* Chat Footer */}
      <Box p={2} height={'10%'} width={'100%'} backgroundColor={'transparent'}>
        <Stack direction={'row'} alignItems={'center'} spacing={3}>
          <Stack width={'100%'}>
            <ChatInput
              setOpenPicker={() => {}}
              messageToSend={messageToSend}
              setMessage={setMessageToSend}
              handleSendMessage={handleSendMessage}
            />
          </Stack>
          <Box backgroundColor={'blue'} borderRadius={'md'}>
            <Stack alignItems={'center'} justifyContent={'center'}></Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default UserGroup;
