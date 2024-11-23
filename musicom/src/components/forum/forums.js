import React, { useState, useEffect } from 'react';
import BgImage from './assets/forums-bg.svg';
import {
  Avatar,
  Menu,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Textarea,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Container,
  Flex,
  Box,
  Image,
  Divider,
  Text,
  Stack,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Center,
  useBreakpointValue,
  HStack,
  VStack,
  Toast,
} from '@chakra-ui/react';
import {
  FaCog,
  FaArrowUp,
  FaArrowDown,
  FaComment,
  FaSearch,
  FaShare,
} from 'react-icons/fa';
import { FiMoreVertical } from 'react-icons/fi';
import { SearchIcon } from '@chakra-ui/icons';
import logo from 'Musicom Resources/Collage_Logo_232x80.png';
import logoM from 'Musicom Resources/Blue Logo Design/No Background/0.75x/Blue-White Icon Logo copy@0.75x.png';
import { useAuth } from 'hooks/auth';
import { app, db, auth, storage, firestore } from 'lib/firebase';
import {
  collection,
  addDoc,
  getDoc,
  setDoc,
  doc,
  getDocs,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  query,
  where,
} from '@firebase/firestore';
import { useParams } from 'react-router-dom';
import { FORUMPOSTS, PROTECTED } from 'lib/routes';
import { Link } from 'react-router-dom';
import { FaCamera } from 'react-icons/fa';
import { useRef } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UpvoteImg from './assets/upvote.svg';
import DownvoteImg from './assets/downvote.svg';
import CommentImg from './assets/comment.svg';
import ShareImg from './assets/share.svg';
import OptionsImg from './assets/options.svg';
import { LuFileInput } from 'react-icons/lu';
import filePdf from '../navbar/pdf-icon.png';
import playVideo from '../navbar/play.png';
import { FiCamera, FiFile, FiPlus, FiSend, FiVideo, FiX } from 'react-icons/fi';
import { Link as goToLink } from 'react-router-dom';
import { runTransaction } from 'firebase/firestore';
import SortIcon from './assets/sort.png';
import { useForceUpdate } from 'framer-motion';

function Comment({ user, text }) {
  const [authorAvatar, setAuthorAvatar] = useState(null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const fetchAuthorAvatar = async (username) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setAuthorAvatar(userData.avatar || null);
      }
    } catch (error) {
      console.error('Error fetching author avatar:', error);
    }
  };

  useEffect(() => {
    fetchAuthorAvatar(user);
  }, [user]);

  return (
    <Box mt="2" p="2" bg="gray.100" borderRadius="md">
      <HStack>
        <Avatar
          height={isMobile ? '25px' : '30px'}
          width={isMobile ? '25px' : '30px'}
          src={authorAvatar || logoM}
        />
        <Button
          color="blue.500"
          as={Link}
          to={`${PROTECTED}/profile/${user}`}
          colorScheme={'#1041B2'}
          variant="link"
          fontSize={'10px'}
        >
          {user}
        </Button>
      </HStack>

      <Text fontSize={'10px'}>{text}</Text>
    </Box>
  );
}

function Posts({
  key,
  forumId,
  postId,
  user,
  postTitle,
  post,
  upvotes,
  comments,
  createdAt,
  imageUrl, // Add imageUrl to the props
}) {
  const [showShare, setShowShare] = useState(false);
  const [votes, setVotes] = useState(upvotes);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const authUser = useAuth();

  const [userVote, setUserVote] = useState(null);
  const [postComments, setPostComments] = useState([]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editedPost, setEditedPost] = useState(post);

  const isPostOwner = authUser?.user?.username === user;
  const [authorAvatar, setAuthorAvatar] = useState(null);

  const fetchAuthorAvatar = async (username) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setAuthorAvatar(userData.avatar || null);
      }
    } catch (error) {
      console.error('Error fetching author avatar:', error);
    }
  };

  useEffect(() => {
    fetchAuthorAvatar(user);
  }, [user]);

  const handleEditPost = () => {
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const postDocRef = doc(db, 'forums', forumId, 'posts', postId);
      await updateDoc(postDocRef, { post: editedPost });
      setEditModalOpen(false);

      window.location.reload();
    } catch (error) {
      console.error('Error editing post: ', error);
    }
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
  };

  const handleDeletePost = async () => {
    try {
      const postDocRef = doc(db, 'forums', forumId, 'posts', postId);
      await deleteDoc(postDocRef);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting post: ', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const postDocRef = doc(db, 'forums', forumId, 'posts', postId);
      const commentsCollectionRef = collection(postDocRef, 'comments');
      const commentsSnapshot = await getDocs(commentsCollectionRef);
      const commentsData = commentsSnapshot.docs.map((doc) => doc.data());
      setPostComments(commentsData);
    } catch (error) {
      console.error('Error fetching comments: ', error);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleCommentSubmit = async () => {
    if (commentText.trim() === '') {
      return;
    }

    try {
      const postDocRef = doc(db, 'forums', forumId, 'posts', postId);
      const commentsCollectionRef = collection(postDocRef, 'comments');

      await addDoc(commentsCollectionRef, {
        user: authUser?.user?.username,
        text: commentText,
        createdAt: serverTimestamp(),
      });

      setPostComments((prevComments) => [
        ...prevComments,
        { user: authUser?.user?.username, text: commentText },
      ]);

      setCommentText('');
    } catch (error) {
      console.error('Error adding comment: ', error);
    }
  };

  useEffect(() => {
    const fetchUserVote = async () => {
      if (!authUser?.user) return;

      const userVoteDocRef = doc(
        db,
        'userVotes',
        `${authUser?.user?.uid}_${postId}`
      );
      const userVoteDocSnap = await getDoc(userVoteDocRef);

      if (userVoteDocSnap.exists()) {
        setUserVote(userVoteDocSnap.data().voteType);
      } else {
        setUserVote(null);
      }
    };

    fetchUserVote();
  }, [postId, authUser?.user]);

  const handleUpvote = async () => {
    if (!authUser?.user) return; // Ensure user is logged in

    const postDocRef = doc(db, 'forums', forumId, 'posts', postId);
    const userVoteDocRef = doc(
      db,
      'userVotes',
      `${authUser.user.uid}_${postId}`
    );

    try {
      const newVoteData = await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postDocRef);
        const userVoteDoc = await transaction.get(userVoteDocRef);

        if (!postDoc.exists()) {
          throw new Error('Post does not exist!');
        }

        const currentVotes = postDoc.data().upvotes || 0;
        let newVotes = currentVotes;
        let newUserVote = 'upvote';

        if (!userVoteDoc.exists()) {
          // New upvote
          newVotes = currentVotes + 1;
        } else {
          const currentUserVote = userVoteDoc.data().voteType;
          if (currentUserVote === 'upvote') {
            // Remove upvote
            newVotes = currentVotes - 1;
            newUserVote = null;
          } else if (currentUserVote === 'downvote') {
            // Change from downvote to upvote
            newVotes = currentVotes + 2;
          }
        }

        transaction.update(postDocRef, { upvotes: newVotes });
        if (newUserVote) {
          transaction.set(userVoteDocRef, { voteType: newUserVote });
        } else {
          transaction.delete(userVoteDocRef);
        }

        return { newVotes, newUserVote };
      });

      setVotes(newVoteData.newVotes);
      setUserVote(newVoteData.newUserVote);
    } catch (error) {
      console.error('Error updating vote: ', error);
    }
  };

  const handleDownvote = async () => {
    if (!authUser?.user) return; // Ensure user is logged in

    const postDocRef = doc(db, 'forums', forumId, 'posts', postId);
    const userVoteDocRef = doc(
      db,
      'userVotes',
      `${authUser.user.uid}_${postId}`
    );

    try {
      const newVoteData = await runTransaction(db, async (transaction) => {
        const postDoc = await transaction.get(postDocRef);
        const userVoteDoc = await transaction.get(userVoteDocRef);

        if (!postDoc.exists()) {
          throw new Error('Post does not exist!');
        }

        const currentVotes = postDoc.data().upvotes || 0;
        let newVotes = currentVotes;
        let newUserVote = 'downvote';

        if (!userVoteDoc.exists()) {
          // New downvote
          newVotes = currentVotes - 1;
        } else {
          const currentUserVote = userVoteDoc.data().voteType;
          if (currentUserVote === 'downvote') {
            // Remove downvote
            newVotes = currentVotes + 1;
            newUserVote = null;
          } else if (currentUserVote === 'upvote') {
            // Change from upvote to downvote
            newVotes = currentVotes - 2;
          }
        }

        transaction.update(postDocRef, { upvotes: newVotes });
        if (newUserVote) {
          transaction.set(userVoteDocRef, { voteType: newUserVote });
        } else {
          transaction.delete(userVoteDocRef);
        }

        return { newVotes, newUserVote };
      });

      setVotes(newVoteData.newVotes);
      setUserVote(newVoteData.newUserVote);
    } catch (error) {
      console.error('Error updating vote: ', error);
    }
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(createdAt);

  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <>
      {!isMobile && (
        <Box p="4" pb={'0'} ml={'20px'} mr={'20px'} mb={'30px'}>
          <Box
            p="4"
            pb={'0'}
            mt={-6}
            ml={'20px'}
            mr={'20px'}
            bg="white"
            borderRadius="lg"
            position="relative"
            border={'1px solid #9F9F9F'}
            boxShadow={'0px 2px 5px #9F9F9F'}
            _hover={{
              backgroundColor: '#f7faff',
            }}
          >
            <Flex alignItems="center" justifyContent="space-between">
              <Box flex="1" ml="4">
                <HStack>
                  <Avatar
                    height={'30px'}
                    width={'30px'}
                    src={authorAvatar || logoM}
                  />
                  <Flex
                    justifyContent={'center'}
                    alignItems={'flex-start'}
                    flexDirection={'column'}
                    ml={2}
                  >
                    <Button
                      color="black"
                      fontSize={'12px'}
                      as={Link}
                      to={`${PROTECTED}/profile/${user}`}
                      variant="link"
                    >
                      {user}
                    </Button>
                    <Text fontSize="8px" color="#9F9F9F" whiteSpace={'nowrap'}>
                      {formattedDate}
                    </Text>
                  </Flex>

                  {isPostOwner && (
                    <Flex
                      justifyContent="flex-end"
                      alignItems="center"
                      width="100%"
                    >
                      <Menu>
                        <MenuButton
                          mr={'2px'}
                          as={IconButton}
                          background={'white'}
                          backgroundImage={OptionsImg}
                          backgroundRepeat={'no-repeat'}
                          backgroundPosition={'center'}
                          backgroundSize={'20px'}
                          _hover={{
                            background: 'white',
                            backgroundImage: `${OptionsImg}`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                          }}
                        />
                        <MenuList
                          border="1px"
                          borderColor="#6899FE87"
                          width="100px"
                          sx={{ minWidth: '100px !important' }}
                          padding={'1px'}
                        >
                          <MenuItem
                            onClick={handleEditPost}
                            borderBottom="1px"
                            borderColor="#6899FE87"
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            padding={'0px'}
                          >
                            Edit Post
                          </MenuItem>
                          <MenuItem
                            onClick={handleDeletePost}
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            padding={'0px'}
                          >
                            Delete Post
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Flex>
                  )}
                </HStack>

                <Text
                  m={'5px 0'}
                  fontSize={'13px'}
                  fontWeight={'bold'}
                  as={goToLink}
                  to={'/protected/forum/forumPosts/' + forumId + '/' + postId}
                  _hover={{
                    textDecor: 'underline',
                  }}
                >
                  {postTitle}
                </Text>

                <VStack alignItems={'flex-start'}>
                  <Text fontSize="10px" mb={0} color={'#696969'}>
                    {post}
                  </Text>
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      height={'150px'}
                      minWidth={'150px'}
                      maxWidth={'200px'}
                      justifyContent={'center'}
                      alignItems={'center'}
                      borderRadius="md"
                      objectFit="cover"
                      mb={'10px'}
                    />
                  )}
                </VStack>
              </Box>
            </Flex>
            <Modal isOpen={editModalOpen} onClose={handleCancelEdit}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Edit Post</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Textarea
                    value={editedPost}
                    onChange={(e) => setEditedPost(e.target.value)}
                    placeholder="Edit your post..."
                  />
                </ModalBody>
                <ModalFooter>
                  <Button colorScheme="blue" mr={3} onClick={handleSaveEdit}>
                    Save
                  </Button>
                  <Button variant="ghost" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
            <HStack spacing="1">
              <IconButton
                background={'white'}
                backgroundImage={UpvoteImg}
                backgroundRepeat={'no-repeat'}
                backgroundPosition={'center'}
                backgroundSize={'15px'}
                onClick={handleUpvote}
                _hover={{
                  backgroundImage: `${UpvoteImg}`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              />
              <Text fontSize="sm" fontWeight="bold" textAlign="center">
                {votes}
              </Text>
              <IconButton
                background={'white'}
                backgroundImage={DownvoteImg}
                backgroundRepeat={'no-repeat'}
                backgroundPosition={'center'}
                backgroundSize={'15px'}
                onClick={handleDownvote}
                _hover={{
                  backgroundImage: `${DownvoteImg}`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              />
              <VStack>
                <Button
                  ml={'20px'}
                  background={'white'}
                  backgroundImage={CommentImg}
                  backgroundRepeat={'no-repeat'}
                  backgroundPosition={'center'}
                  backgroundSize={'15px'}
                  onClick={toggleComments}
                  _hover={{
                    backgroundImage: `${CommentImg}`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                  }}
                ></Button>
              </VStack>
              <Text fontSize={'sm'} cursor="pointer">
                {postComments.length}
              </Text>
              <Flex justifyContent="flex-end" alignItems="center" width="100%">
                <IconButton
                  background={'white'}
                  backgroundImage={ShareImg}
                  backgroundRepeat={'no-repeat'}
                  backgroundPosition={'center'}
                  backgroundSize={'20px'}
                  _hover={{
                    backgroundImage: `${ShareImg}`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundSize: '15px',
                  }}
                  onClick={() => setShowShare(!showShare)}
                />
              </Flex>
            </HStack>
          </Box>
          {showComments && (
            <Box mt="12px" ml={'20px'} mr={'20px'}>
              {postComments.map((comment, index) => (
                <Comment key={index} {...comment} />
              ))}
              <InputGroup mt="2">
                <Input
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  width="50%"
                />
                <Button
                  mt="1"
                  ml="3"
                  colorScheme="blue"
                  size="sm"
                  onClick={handleCommentSubmit}
                >
                  Comment
                </Button>
              </InputGroup>
            </Box>
          )}
        </Box>
      )}

      {isMobile && (
        <Box pb={'0'} mb={'30px'}>
          <Box
            p="4"
            pb={'0'}
            mt={-6}
            bg="white"
            borderRadius="lg"
            position="relative"
            border={'1px solid #9F9F9F'}
            boxShadow={'0px 2px 5px #9F9F9F'}
            _hover={{
              backgroundColor: '#f7faff',
            }}
          >
            <Flex alignItems="center" justifyContent="space-between">
              <Box flex="1" ml="2">
                <HStack>
                  <Avatar
                    height={'25px'}
                    width={'25px'}
                    src={authorAvatar || logoM}
                  />
                  <Flex
                    justifyContent={'center'}
                    alignItems={'flex-start'}
                    flexDirection={'column'}
                  >
                    <Button
                      color="black"
                      fontSize={'10px'}
                      as={Link}
                      to={`${PROTECTED}/profile/${user}`}
                      variant="link"
                    >
                      {user}
                    </Button>
                    <Text fontSize="8px" color="#9F9F9F" whiteSpace={'nowrap'}>
                      {formattedDate}
                    </Text>
                  </Flex>

                  {isPostOwner && (
                    <Flex
                      justifyContent="flex-end"
                      alignItems="center"
                      width="100%"
                    >
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          background={'white'}
                          backgroundImage={OptionsImg}
                          backgroundRepeat={'no-repeat'}
                          backgroundPosition={'center'}
                          backgroundSize={'12px'}
                          _hover={{
                            background: 'white',
                            backgroundImage: `${OptionsImg}`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            backgroundSize: '12px',
                          }}
                        />
                        <MenuList
                          border="1px"
                          borderColor="#6899FE87"
                          width="100px"
                          sx={{ minWidth: '100px !important' }}
                          padding={'1px'}
                        >
                          <MenuItem
                            onClick={handleEditPost}
                            borderBottom="1px"
                            borderColor="#6899FE87"
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            padding={'0px'}
                            fontSize={'10px'}
                          >
                            Edit Post
                          </MenuItem>
                          <MenuItem
                            onClick={handleDeletePost}
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            padding={'0px'}
                            fontSize={'10px'}
                          >
                            Delete Post
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Flex>
                  )}
                </HStack>

                <Text
                  m={'5px 0'}
                  fontSize={'10px'}
                  fontWeight={'bold'}
                  as={goToLink}
                  to={FORUMPOSTS}
                  _hover={{
                    textDecor: 'underline',
                  }}
                >
                  {postTitle}
                </Text>

                <VStack alignItems={'flex-start'}>
                  <Text fontSize="8px" mb={0} color={'#696969'}>
                    {post}
                  </Text>
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      height={'75px'}
                      minWidth={'75px'}
                      maxWidth={'100px'}
                      justifyContent={'center'}
                      alignItems={'center'}
                      borderRadius="md"
                      objectFit="cover"
                      mb={'5px'}
                    />
                  )}
                </VStack>
              </Box>
            </Flex>
            <Modal isOpen={editModalOpen} onClose={handleCancelEdit}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Edit Post</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Textarea
                    value={editedPost}
                    onChange={(e) => setEditedPost(e.target.value)}
                    placeholder="Edit your post..."
                  />
                </ModalBody>
                <ModalFooter>
                  <Button colorScheme="blue" mr={3} onClick={handleSaveEdit}>
                    Save
                  </Button>
                  <Button variant="ghost" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
            <HStack spacing="0">
              <IconButton
                background={'white'}
                backgroundImage={UpvoteImg}
                backgroundRepeat={'no-repeat'}
                backgroundPosition={'center'}
                backgroundSize={'12px'}
                onClick={handleUpvote}
                _hover={{
                  backgroundImage: `${UpvoteImg}`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  backgroundSize: '12px',
                }}
              />
              <Text fontSize="9px" fontWeight="bold" textAlign="center">
                {votes}
              </Text>
              <IconButton
                background={'white'}
                backgroundImage={DownvoteImg}
                backgroundRepeat={'no-repeat'}
                backgroundPosition={'center'}
                backgroundSize={'12px'}
                onClick={handleDownvote}
                _hover={{
                  backgroundImage: `${DownvoteImg}`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                  backgroundSize: '12px',
                }}
              />
              <VStack>
                <Button
                  ml={'0px'}
                  background={'white'}
                  backgroundImage={CommentImg}
                  backgroundRepeat={'no-repeat'}
                  backgroundPosition={'center'}
                  backgroundSize={'12px'}
                  onClick={toggleComments}
                  _hover={{
                    backgroundImage: `${CommentImg}`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundSize: '12px',
                  }}
                ></Button>
              </VStack>
              <Text fontSize={'9'} cursor="pointer">
                {postComments.length}
              </Text>
              <Flex justifyContent="flex-end" alignItems="center" width="100%">
                <IconButton
                  background={'white'}
                  backgroundImage={ShareImg}
                  backgroundRepeat={'no-repeat'}
                  backgroundPosition={'center'}
                  backgroundSize={'12px'}
                  _hover={{
                    backgroundImage: `${ShareImg}`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    backgroundSize: '12px',
                  }}
                  onClick={() => setShowShare(!showShare)}
                />
              </Flex>
            </HStack>
          </Box>
          {showComments && (
            <Box mt="10px">
              {postComments.map((comment, index) => (
                <Comment key={index} {...comment} />
              ))}
              <InputGroup mt="2">
                <Input
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  width="50%"
                />
                <Button
                  mt="1"
                  ml="3"
                  colorScheme="blue"
                  size="sm"
                  onClick={handleCommentSubmit}
                >
                  Comment
                </Button>
              </InputGroup>
            </Box>
          )}
        </Box>
      )}
    </>
  );
}

function Forums() {
  const authUser = useAuth();

  const uid = authUser.user;
  const { id, title, owner, members, post } = useParams();
  const [forum, setForum] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [posts, setPosts] = useState([]);

  const isForumOwner = forum?.owner === auth?.currentUser?.uid;

  const [editForumModalOpen, setEditForumModalOpen] = useState(false);
  const [editedForumName, setEditedForumName] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const fileInputRef = useRef(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [forums, setForums] = useState([]);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const openCreatePostModal = () => setIsPostModalOpen(true);
  const closeCreatePostModal = () => setIsPostModalOpen(false);

  const handleCreatePost = async () => {
    try {
      let imageUrl = '';

      if (selectedFiles.length > 0) {
        const file = selectedFiles[0];

        const storageRef = ref(getStorage());
        const fileRef = ref(storage, `forumPosts/${id}/${file.name}`);

        await uploadBytes(fileRef, file);
        imageUrl = await getDownloadURL(fileRef);
      }

      const postsCollectionRef = collection(db, 'forums', id, 'posts');
      await addDoc(postsCollectionRef, {
        user: user,
        postTitle: newPostTitle,
        post: newPostContent,
        upvotes: 0,
        comments: 0,
        createdAt: time,
        imageUrl,
      });

      setPosts([
        ...posts,
        {
          user: user,
          postTitle: newPostTitle,
          post: newPostContent,
          upvotes: 0,
          comments: 0,
          imageUrl,
        },
      ]);

      setNewPostTitle('');
      setNewPostContent('');
      setSelectedFiles([]);
      closeCreatePostModal();
      window.location.reload();
    } catch (error) {
      console.log(`Error creating post: ${error}`);
    }
  };

  const handleImageChange = async (event) => {
    try {
      const file = event.target.files[0];

      if (!file) {
        throw new Error('No file selected');
      }

      const storageRef = ref(getStorage());
      const fileRef = ref(storage, `forumCovers/${id}`); // Storing cover images based on forum ID

      await uploadBytes(fileRef, file);

      const imageUrl = await getDownloadURL(fileRef);
      console.log(imageUrl);

      // Update the Firestore document with the new cover image URL
      const forumDocRef = doc(db, 'forums', id);
      await updateDoc(forumDocRef, { coverImageUrl: imageUrl });

      // Update the state to reflect the new cover image URL
      setCoverImage(imageUrl);

      // Optionally, you can provide feedback to the user that the image upload was successful
    } catch (error) {
      console.error('Error uploading image:', error);
      // Optionally, you can also notify the user about the error.
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current.click();
  };
  const handleEditForum = () => {
    setEditedForumName(forum?.title || '');
    setEditForumModalOpen(true);
  };

  const handleSaveEditForum = async () => {
    try {
      const forumDocRef = doc(db, 'forums', id);
      await updateDoc(forumDocRef, { title: editedForumName });
      setEditForumModalOpen(false);
      // You might want to update the local state or display a success message
    } catch (error) {
      console.error('Error editing forum name: ', error);
    }
  };

  const handleCancelEditForum = () => {
    setEditForumModalOpen(false);
  };

  const handleDeleteForum = async () => {
    try {
      const forumDocRef = doc(db, 'forums', id);
      await deleteDoc(forumDocRef);
    } catch (error) {
      console.error('Error deleting forum: ', error);
    }
  };

  const fetchForum = async () => {
    try {
      const forumDocRef = doc(db, 'forums', id);
      const forumDocSnap = await getDoc(forumDocRef);
      if (forumDocSnap.exists()) {
        setForum({ id: forumDocSnap.id, ...forumDocSnap.data() });
      } else {
        console.log('Forum not found');
      }
    } catch (error) {
      console.error('Error fetching forum: ', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const postsCollectionRef = collection(db, 'forums', id, 'posts');
      const postsSnapshot = await getDocs(postsCollectionRef);
      const postsData = postsSnapshot.docs.map((doc) => ({
        postId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      }));
      postsData.sort((a, b) => b.createdAt - a.createdAt);
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts: ', error);
    }
  };

  const fetchForumCover = async () => {
    try {
      const forumDocRef = doc(db, 'forums', id);
      const forumDocSnap = await getDoc(forumDocRef);
      if (forumDocSnap.exists()) {
        const data = forumDocSnap.data();
        setCoverImage(data.coverImageUrl || null); // Set the cover image URL state
      } else {
        console.log('Forum document not found');
      }
    } catch (error) {
      console.error('Error fetching forum cover: ', error);
    }
  };

  useEffect(() => {
    fetchForum();
    fetchPosts();
    fetchForumCover();
  }, [id]);

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const allPosts = [];

        for (const forum of forums) {
          const postsCollectionRef = collection(
            db,
            'forums',
            forum.id,
            'posts'
          );
          const postsSnapshot = await getDocs(postsCollectionRef);
          const postsData = postsSnapshot.docs.map((doc) => ({
            forumId: forum.id,
            forumTitle: forum.title,
            members: forum.members,

            postId: doc.id,
            ...doc.data(),
          }));
          allPosts.push(...postsData);
        }

        const dateNow = new Date();
        const oneWeekAgo = new Date(
          dateNow.getTime() - 7 * 24 * 60 * 60 * 1000
        );

        // Sort posts by highest of the week
        fetchSortPosts();
      } catch (error) {
        console.error('Error fetching posts: ', error);
      }
    };

    fetchAllPosts();
  }, [forums]);

  const user = authUser?.user?.username;
  const time = serverTimestamp();

  const joinForum = async () => {
    try {
      const forumDocRef = doc(db, 'forums', id);
      const forumDoc = await getDoc(forumDocRef);

      if (forumDoc.exists()) {
        const forumData = forumDoc.data();
        const currentMembers = forumData.members || [];

        // Check if the user is already a member
        if (!currentMembers.includes(auth?.currentUser?.uid)) {
          // Add user's UID to the members array
          currentMembers.push(auth?.currentUser?.uid);

          // Update the members array in the database
          await updateDoc(forumDocRef, { members: currentMembers });

          // Update the local state to reflect the change
          setForum({ ...forumData, members: currentMembers });
        }
      }
    } catch (error) {
      console.error('Error joining forum: ', error);
    }
  };

  const leaveForum = async () => {
    try {
      const forumDocRef = doc(db, 'forums', id);
      const forumDoc = await getDoc(forumDocRef);

      if (forumDoc.exists()) {
        const forumData = forumDoc.data();
        const currentMembers = forumData.members || [];

        // Check if the user is a member
        if (currentMembers.includes(auth?.currentUser?.uid)) {
          // Remove user's UID from the members array
          const updatedMembers = currentMembers.filter(
            (memberId) => memberId !== auth?.currentUser?.uid
          );

          // Update the members array in the database
          await updateDoc(forumDocRef, { members: updatedMembers });

          // Update the local state to reflect the change
          setForum({ ...forumData, members: updatedMembers });
        }
      }
    } catch (error) {
      console.error('Error leaving forum: ', error);
    }
  };

  const handleUploadCover = () => {
    fileInputRef.current.click(); // Trigger the file input click to select an image
  };

  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const handleFileDelete = (file) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((prevFile) => prevFile.name !== file.name)
    );
  };

  const displayMembers = () => {
    if (forum && forum.members) {
      return forum.members.length > 1
        ? `${forum.members.length} members`
        : `${forum.members.length} member`;
    }
  };

  const [sortBy, setSortBy] = useState('highest-of-the-week'); //sort by highest upvote first

  const handleSortOptionChange = (option) => {
    setSortBy(option);
  };

  useEffect(() => {
    fetchSortPosts();
  }, [sortBy]);

  const fetchSortPosts = async () => {
    try {
      const postsCollectionRef = collection(db, 'forums', id, 'posts');
      const postsSnapshot = await getDocs(postsCollectionRef);
      let postsData = postsSnapshot.docs.map((doc) => ({
        postId: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      }));

      const dateNow = new Date();
      const oneWeekAgo = new Date(dateNow.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(
        dateNow.getFullYear(),
        dateNow.getMonth() - 1,
        dateNow.getDate()
      );
      const oneYearAgo = new Date(
        dateNow.getFullYear() - 1,
        dateNow.getMonth(),
        dateNow.getDate()
      );

      switch (sortBy) {
        case 'highest-of-all-time':
          postsData.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
          break;
        case 'highest-of-the-year':
          postsData = postsData.filter((post) => post.createdAt >= oneYearAgo);
          postsData.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
          break;
        case 'highest-of-the-month':
          postsData = postsData.filter((post) => post.createdAt >= oneMonthAgo);
          postsData.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
          break;
        case 'highest-of-the-week':
          postsData = postsData.filter((post) => post.createdAt >= oneWeekAgo);
          postsData.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
          break;
        case 'latest':
          postsData.sort((a, b) => b.createdAt - a.createdAt);
          break;
        default:
          // Default to "highest-of-the-week" if sortBy is not recognized
          postsData = postsData.filter((post) => post.createdAt >= oneWeekAgo);
          postsData.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
      }

      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts: ', error);
    }
  };

  return (
    <>
      {!isMobile && (
        <Center
          backgroundImage={BgImage}
          backgroundRepeat={'no-repeat'}
          backgroundSize={'cover'}
        >
          <Container
            maxW="container.md"
            mt="0"
            backgroundColor={'white'}
            minHeight={'720px'}
            pr={0}
            pl={0}
          >
            <Flex
              justifyContent="center"
              alignItems="center"
              mb="0"
              pt="3"
              pr={0}
              pl={0}
              boxShadow="sm"
              borderRadius="md"
              marginTop="25px"
              position="relative"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              {isForumOwner && (
                <IconButton
                  icon={<FaCamera />} // Use the FaCamera icon for changing the cover image
                  variant="ghost"
                  backgroundColor={'white'}
                  size="sm"
                  colorScheme="blue"
                  aria-label="Change Cover Image"
                  onClick={handleCameraClick} // Open file input when clicked
                  position="absolute"
                  bottom="4"
                  right="4"
                />
              )}
              <Box height="250px" width="100%">
                {coverImage ? (
                  <img
                    src={coverImage}
                    alt="Cover"
                    style={{ width: '100%', height: '100%' }}
                  /> // Set width to 100% and height to 100% of the parent box
                ) : (
                  <Box
                    width="100%"
                    height="100%"
                    bg="gray.200"
                    borderRadius="md"
                  /> // Display placeholder if cover image not available
                )}
              </Box>
            </Flex>

            <HStack justifyContent="center" alignItems={'center'}>
              <Text fontSize="30px" fontWeight="bold" color="#6899FE">
                {forum?.title}
              </Text>
              {isForumOwner && (
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FaCog />}
                    variant="ghost"
                    size="sm"
                    colorScheme="gray"
                    mt={'10px'}
                    border="1px"
                    borderColor="#6899FE87"
                  />
                  <MenuList
                    border="1px"
                    borderColor="#6899FE87"
                    width="100px"
                    sx={{ minWidth: '100px !important' }}
                    padding={'1px'}
                  >
                    <MenuItem
                      onClick={handleEditForum}
                      borderBottom="1px"
                      borderColor="#6899FE87"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      padding={'0px'}
                    >
                      Edit Forum
                    </MenuItem>
                    <MenuItem
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      onClick={handleDeleteForum}
                      padding={'0px'}
                    >
                      Delete Forum
                    </MenuItem>
                  </MenuList>
                </Menu>
              )}
            </HStack>

            <Flex justifyContent="center">
              <Text fontSize={'sm'} color="black">
                {displayMembers()}
              </Text>
            </Flex>

            <HStack
              justifyContent="center"
              mb={forum?.members?.includes(auth?.currentUser?.uid) ? '0' : '4'}
              gap={'15px'}
            >
              {forum?.members?.includes(auth?.currentUser?.uid) && (
                <Flex
                  justifyContent="space-between"
                  boxShadow="sm"
                  borderRadius="md"
                  marginTop=""
                >
                  <InputGroup>
                    <Flex flex={1} />
                    <Button
                      backgroundColor={'#6899FE'}
                      color={'white'}
                      size="sm"
                      onClick={openCreatePostModal}
                      ml="0"
                      _hover={{ backgroundColor: '#4569b5' }}
                      fontWeight={'300'}
                    >
                      Create Post
                    </Button>
                    <Flex flex={1} />
                  </InputGroup>
                </Flex>
              )}
              <Button
                colorScheme={
                  forum?.members?.includes(auth?.currentUser?.uid)
                    ? 'red'
                    : 'blue'
                }
                size="sm"
                mt="3"
                mb="3"
                fontWeight={'300'}
                onClick={
                  forum?.members?.includes(auth?.currentUser?.uid)
                    ? leaveForum
                    : joinForum
                }
              >
                {forum?.members?.includes(auth?.currentUser?.uid)
                  ? 'Leave Forum'
                  : 'Join Forum'}
              </Button>

              <Modal
                isOpen={editForumModalOpen}
                onClose={handleCancelEditForum}
              >
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader>Edit Forum Name</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <Input
                      value={editedForumName}
                      onChange={(e) => setEditedForumName(e.target.value)}
                      placeholder="Edit forum name..."
                    />
                  </ModalBody>
                  <ModalFooter>
                    <Button
                      colorScheme="blue"
                      mr={3}
                      onClick={handleSaveEditForum}
                    >
                      Save
                    </Button>
                    <Button variant="ghost" onClick={handleCancelEditForum}>
                      Cancel
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </HStack>
            <Modal
              isOpen={isPostModalOpen}
              onClose={closeCreatePostModal}
              isCentered
            >
              <ModalOverlay />
              <ModalContent maxW="500px">
                <ModalHeader fontSize={'20px'} mt={'5px'} fontWeight={'500'}>
                  Create a Forum Post
                </ModalHeader>
                <ModalCloseButton />
                <Box
                  border={'1px solid #E2E8F0'}
                  borderRadius={'5px'}
                  margin={'17.5px'}
                  mt={'5px'}
                  mb={'30px'}
                  padding={'2.5px 1px'}
                  pb={'0px'}
                >
                  <ModalBody>
                    <HStack mb={'10px'}>
                      <Avatar
                        size="sm"
                        user={user}
                        post={true}
                        color="#6899FE"
                      />
                      <Text color={'#9f9f9f'} mt={'1px'}>
                        {user}
                      </Text>
                    </HStack>
                    <Input
                      placeholder="Share your notes ♪"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      mb={2}
                    />
                    <Textarea
                      placeholder="Description"
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                    />
                    <HStack justifyContent={'space-between'} mt={'10px'} mb={1}>
                      <label htmlFor="file-input">
                        <IconButton
                          as="span"
                          background="none"
                          _hover={{ background: 'gray.200' }}
                          cursor="pointer"
                          icon={<LuFileInput size={18} color="#6899FE" />}
                        />
                        <input
                          id="file-input"
                          type="file"
                          style={{ display: 'none' }}
                          multiple
                          accept="*"
                          onChange={handleFileInputChange}
                        />
                      </label>
                      <IconButton
                        bg="#fff"
                        rounded="md"
                        size="sm"
                        type="submit"
                        icon={<FiSend fontSize={'18px'} color="#6899FE" />}
                        fontWeight="bold"
                        onClick={handleCreatePost}
                      />
                    </HStack>
                    <VStack align="start" spacing={1} mt={2} ml="10px">
                      {selectedFiles.length > 0 && (
                        <Flex wrap="wrap" align="center">
                          {selectedFiles.map((file) => (
                            <HStack key={file.name} gap={0}>
                              <div
                                style={{
                                  border: '1px solid #ccc',
                                  borderRadius: '5px',
                                  padding: '5px',
                                  marginTop: '2.5px',
                                  marginBottom: '2.5px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  position: 'relative',
                                }}
                              >
                                {file.type.startsWith('image/') ? (
                                  <img
                                    src={URL.createObjectURL(file)}
                                    style={{
                                      height: '60px',
                                      width: '60px',
                                      borderRadius: '6px',
                                      objectFit: 'cover',
                                      cursor: 'pointer',
                                    }}
                                  />
                                ) : file.type.startsWith('video/') ? (
                                  <div
                                    style={{
                                      position: 'relative',
                                      height: '60px',
                                      width: '60px',
                                    }}
                                  >
                                    <video
                                      src={URL.createObjectURL(file)}
                                      style={{
                                        height: '100%',
                                        width: '100%',
                                        borderRadius: '6px',
                                        objectFit: 'cover',
                                      }}
                                    />
                                    <img
                                      src={playVideo}
                                      style={{
                                        position: 'absolute',
                                        height: '24px',
                                        width: '24px',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        cursor: 'pointer',
                                      }}
                                    />
                                  </div>
                                ) : file.type.startsWith('audio/') ? (
                                  <audio
                                    src={URL.createObjectURL(file)}
                                    controls
                                    style={{
                                      transform: 'scale(0.75)',
                                      position: 'relative',
                                      left: '-44px',
                                    }}
                                  />
                                ) : (
                                  <img
                                    src={filePdf}
                                    style={{
                                      height: '40px',
                                      width: '40px',
                                      borderRadius: '6px',
                                      objectFit: 'cover',
                                      cursor: 'pointer',
                                    }}
                                  />
                                )}
                                {file.type.startsWith('application/pdf') && (
                                  <Text m="1">{file.name}</Text>
                                )}
                              </div>
                              <IconButton
                                key={`delete-${file.name}`}
                                marginBottom={55}
                                marginRight={2.5}
                                as="span"
                                background="none"
                                minWidth={0}
                                marginLeft={1}
                                _hover={{ background: 'gray.200' }}
                                icon={<FiX size={10} />}
                                onClick={() => handleFileDelete(file)}
                              />
                            </HStack>
                          ))}
                        </Flex>
                      )}
                    </VStack>
                  </ModalBody>
                </Box>
              </ModalContent>
            </Modal>

            <Center>
              <Divider
                orientation="horizontal"
                mt={'15px'}
                width={'90%'}
                borderColor={'#9F9F9F'}
              />
            </Center>
            <VStack
              alignItems={'baseline'}
              mt={'20px'}
              mb={'30px'}
              ml={'45px'}
              justifyContent={'center'}
            >
              <Menu>
                <MenuButton
                  as={Button}
                  aria-label="Options"
                  text={'Sort By'}
                  backgroundColor={'white'}
                  _hover={{
                    transform: 'translateY(1px)',
                  }}
                  _active={{
                    background: SortIcon,
                  }}
                >
                  <HStack>
                    <Text
                      fontWeight={'400'}
                      fontSize={'12.5px'}
                      textDecor={'underline'}
                      _hover={{ color: '#706d63' }}
                      cursor={'pointer'}
                    >
                      Sort By:{' '}
                      {sortBy === 'latest'
                        ? 'Latest'
                        : sortBy === 'highest-of-the-week'
                        ? 'Highest of the Week'
                        : sortBy === 'highest-of-the-month'
                        ? 'Highest of the Month'
                        : sortBy === 'highest-of-the-year'
                        ? 'Highest of the Year'
                        : 'Highest of All Time'}
                    </Text>

                    <Image src={SortIcon}></Image>
                  </HStack>
                </MenuButton>
                <MenuList
                  padding={0}
                  border={'0.5px solid black'}
                  borderTop={'0px'}
                  borderBottom={'0px'}
                >
                  <MenuItem
                    backgroundColor={'white'}
                    justifyContent={'center'}
                    padding={0}
                    border={'0.5px solid black'}
                    borderLeft={'0px'}
                    borderRight={'0px'}
                    borderTopRadius={'5px'}
                    fontWeight={'500'}
                    onClick={() => handleSortOptionChange('latest')}
                  >
                    Latest
                  </MenuItem>
                  <MenuItem
                    justifyContent={'center'}
                    border={'0.5px solid black'}
                    borderTop={'0px'}
                    borderLeft={'0px'}
                    borderRight={'0px'}
                    padding={0}
                    fontWeight={'500'}
                    onClick={() =>
                      handleSortOptionChange('highest-of-the-week')
                    }
                  >
                    Highest of the Week
                  </MenuItem>
                  <MenuItem
                    justifyContent={'center'}
                    border={'0.5px solid black'}
                    borderTop={'0px'}
                    borderLeft={'0px'}
                    borderRight={'0px'}
                    padding={0}
                    fontWeight={'500'}
                    onClick={() =>
                      handleSortOptionChange('highest-of-the-month')
                    }
                  >
                    Highest of the Month
                  </MenuItem>
                  <MenuItem
                    justifyContent={'center'}
                    border={'0.5px solid black'}
                    borderTop={'0px'}
                    borderLeft={'0px'}
                    borderRight={'0px'}
                    padding={0}
                    fontWeight={'500'}
                    onClick={() =>
                      handleSortOptionChange('highest-of-the-year')
                    }
                  >
                    Highest of the Year
                  </MenuItem>
                  <MenuItem
                    justifyContent={'center'}
                    border={'0.5px solid black'}
                    borderTop={'0px'}
                    borderBottomRadius={'5px'}
                    borderLeft={'0px'}
                    borderRight={'0px'}
                    padding={0}
                    fontWeight={'500'}
                    onClick={() =>
                      handleSortOptionChange('highest-of-all-time')
                    }
                  >
                    Highest of All Time
                  </MenuItem>
                </MenuList>
              </Menu>
            </VStack>

            <Stack spacing="4">
              {posts.map((post, index) => (
                <Posts key={index} forumId={id} {...post} />
              ))}
            </Stack>
          </Container>
        </Center>
      )}

      {isMobile && (
        <Container
          width={'100%'}
          mt="30px"
          backgroundColor={'white'}
          minHeight={'100vh'}
          pr={0}
          pl={0}
        >
          <Flex
            justifyContent="center"
            alignItems="center"
            mb="0"
            pt="3"
            pr={0}
            pl={0}
            boxShadow="sm"
            borderRadius="md"
            marginTop="25px"
            position="relative"
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            {isForumOwner && (
              <IconButton
                icon={<FaCamera />} // Use the FaCamera icon for changing the cover image
                variant="ghost"
                backgroundColor={'white'}
                size="sm"
                colorScheme="blue"
                aria-label="Change Cover Image"
                onClick={handleCameraClick} // Open file input when clicked
                position="absolute"
                bottom="4"
                right="4"
              />
            )}
            <Box height="125px" width="100vw">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt="Cover"
                  style={{ width: '100%', height: '100%' }}
                /> // Set width to 100% and height to 100% of the parent box
              ) : (
                <Box
                  width="100%"
                  height="100%"
                  bg="gray.200"
                  borderRadius="md"
                /> // Display placeholder if cover image not available
              )}
            </Box>
          </Flex>

          <HStack
            justifyContent="center"
            alignItems={'center'}
            gap={'5px'}
            mt={'5px'}
          >
            <Text fontSize="20px" fontWeight="bold" color="#6899FE">
              {forum?.title}
            </Text>
            {isForumOwner && (
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<FaCog />}
                  variant="ghost"
                  size="xs"
                  colorScheme="gray"
                  mt={'5px'}
                  border="1px"
                  borderColor="#6899FE87"
                />
                <MenuList
                  border="1px"
                  borderColor="#6899FE87"
                  width="100px"
                  sx={{ minWidth: '100px !important' }}
                  padding={'1px'}
                >
                  <MenuItem
                    onClick={handleEditForum}
                    borderBottom="1px"
                    borderColor="#6899FE87"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    padding={'0px'}
                    fontSize={'10px'}
                  >
                    Edit Forum
                  </MenuItem>
                  <MenuItem
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    onClick={handleDeleteForum}
                    padding={'0px'}
                    fontSize={'10px'}
                  >
                    Delete Forum
                  </MenuItem>
                </MenuList>
              </Menu>
            )}
          </HStack>

          <Flex justifyContent="center">
            <Text fontSize={'sm'} color="black">
              {displayMembers()}
            </Text>
          </Flex>

          <HStack
            justifyContent="center"
            mb={forum?.members?.includes(auth?.currentUser?.uid) ? '0' : '4'}
            gap={'15px'}
          >
            {forum?.members?.includes(auth?.currentUser?.uid) && (
              <Flex
                justifyContent="space-between"
                boxShadow="sm"
                borderRadius="md"
                marginTop=""
              >
                <InputGroup>
                  <Flex flex={1} />
                  <Button
                    backgroundColor={'#6899FE'}
                    color={'white'}
                    size="sm"
                    onClick={openCreatePostModal}
                    ml="0"
                    _hover={{ backgroundColor: '#4569b5' }}
                    fontWeight={'300'}
                  >
                    Create Post
                  </Button>
                  <Flex flex={1} />
                </InputGroup>
              </Flex>
            )}
            <Button
              colorScheme={
                forum?.members?.includes(auth?.currentUser?.uid)
                  ? 'red'
                  : 'blue'
              }
              size="sm"
              mt="3"
              mb="3"
              fontWeight={'300'}
              onClick={
                forum?.members?.includes(auth?.currentUser?.uid)
                  ? leaveForum
                  : joinForum
              }
            >
              {forum?.members?.includes(auth?.currentUser?.uid)
                ? 'Leave Forum'
                : 'Join Forum'}
            </Button>

            <Modal isOpen={editForumModalOpen} onClose={handleCancelEditForum}>
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>Edit Forum Name</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <Input
                    value={editedForumName}
                    onChange={(e) => setEditedForumName(e.target.value)}
                    placeholder="Edit forum name..."
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    colorScheme="blue"
                    mr={3}
                    onClick={handleSaveEditForum}
                  >
                    Save
                  </Button>
                  <Button variant="ghost" onClick={handleCancelEditForum}>
                    Cancel
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </HStack>
          <Modal
            isOpen={isPostModalOpen}
            onClose={closeCreatePostModal}
            isCentered
          >
            <ModalOverlay />
            <ModalContent maxW="500px">
              <ModalHeader fontSize={'20px'} mt={'5px'} fontWeight={'500'}>
                Create a Forum Post
              </ModalHeader>
              <ModalCloseButton />
              <Box
                border={'1px solid #E2E8F0'}
                borderRadius={'5px'}
                margin={'17.5px'}
                mt={'5px'}
                mb={'30px'}
                padding={'2.5px 1px'}
                pb={'0px'}
              >
                <ModalBody>
                  <HStack mb={'10px'}>
                    <Avatar size="sm" user={user} post={true} color="#6899FE" />
                    <Text color={'#9f9f9f'} mt={'1px'}>
                      {user}
                    </Text>
                  </HStack>
                  <Input
                    placeholder="Share your notes ♪"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    mb={2}
                  />
                  <Textarea
                    placeholder="Description"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                  />
                  <HStack justifyContent={'space-between'} mt={'10px'} mb={1}>
                    <label htmlFor="file-input">
                      <IconButton
                        as="span"
                        background="none"
                        _hover={{ background: 'gray.200' }}
                        cursor="pointer"
                        icon={<LuFileInput size={18} color="#6899FE" />}
                      />
                      <input
                        id="file-input"
                        type="file"
                        style={{ display: 'none' }}
                        multiple
                        accept="*"
                        onChange={handleFileInputChange}
                      />
                    </label>
                    <IconButton
                      bg="#fff"
                      rounded="md"
                      size="sm"
                      type="submit"
                      icon={<FiSend fontSize={'18px'} color="#6899FE" />}
                      fontWeight="bold"
                      onClick={handleCreatePost}
                    />
                  </HStack>
                  <VStack align="start" spacing={1} mt={2} ml="10px">
                    {selectedFiles.length > 0 && (
                      <Flex wrap="wrap" align="center">
                        {selectedFiles.map((file) => (
                          <HStack key={file.name} gap={0}>
                            <div
                              style={{
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                                padding: '5px',
                                marginTop: '2.5px',
                                marginBottom: '2.5px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                              }}
                            >
                              {file.type.startsWith('image/') ? (
                                <img
                                  src={URL.createObjectURL(file)}
                                  style={{
                                    height: '60px',
                                    width: '60px',
                                    borderRadius: '6px',
                                    objectFit: 'cover',
                                    cursor: 'pointer',
                                  }}
                                />
                              ) : file.type.startsWith('video/') ? (
                                <div
                                  style={{
                                    position: 'relative',
                                    height: '60px',
                                    width: '60px',
                                  }}
                                >
                                  <video
                                    src={URL.createObjectURL(file)}
                                    style={{
                                      height: '100%',
                                      width: '100%',
                                      borderRadius: '6px',
                                      objectFit: 'cover',
                                    }}
                                  />
                                  <img
                                    src={playVideo}
                                    style={{
                                      position: 'absolute',
                                      height: '24px',
                                      width: '24px',
                                      top: '50%',
                                      left: '50%',
                                      transform: 'translate(-50%, -50%)',
                                      cursor: 'pointer',
                                    }}
                                  />
                                </div>
                              ) : file.type.startsWith('audio/') ? (
                                <audio
                                  src={URL.createObjectURL(file)}
                                  controls
                                  style={{
                                    transform: 'scale(0.75)',
                                    position: 'relative',
                                    left: '-44px',
                                  }}
                                />
                              ) : (
                                <img
                                  src={filePdf}
                                  style={{
                                    height: '40px',
                                    width: '40px',
                                    borderRadius: '6px',
                                    objectFit: 'cover',
                                    cursor: 'pointer',
                                  }}
                                />
                              )}
                              {file.type.startsWith('application/pdf') && (
                                <Text m="1">{file.name}</Text>
                              )}
                            </div>
                            <IconButton
                              key={`delete-${file.name}`}
                              marginBottom={55}
                              marginRight={2.5}
                              as="span"
                              background="none"
                              minWidth={0}
                              marginLeft={1}
                              _hover={{ background: 'gray.200' }}
                              icon={<FiX size={10} />}
                              onClick={() => handleFileDelete(file)}
                            />
                          </HStack>
                        ))}
                      </Flex>
                    )}
                  </VStack>
                </ModalBody>
              </Box>
            </ModalContent>
          </Modal>

          <Center>
            <Divider
              orientation="horizontal"
              mt={'10px'}
              width={'100vw'}
              borderColor={'#9F9F9F'}
            />
          </Center>
          <VStack
            mt={'10px'}
            mb={'30px'}
            justifyContent={'center'}
            alignItems={'flex-start'}
          >
            <Menu>
              <MenuButton
                as={Button}
                aria-label="Options"
                text={'Sort By'}
                backgroundColor={'white'}
                _hover={{
                  transform: 'translateY(1px)',
                }}
                _active={{
                  background: SortIcon,
                }}
              >
                <HStack>
                  <Text
                    fontWeight={'400'}
                    fontSize={'12.5px'}
                    textDecor={'underline'}
                    _hover={{ color: '#706d63' }}
                    cursor={'pointer'}
                  >
                    Sort By:{' '}
                    {sortBy === 'latest'
                      ? 'Latest'
                      : sortBy === 'highest-of-the-week'
                      ? 'Highest of the Week'
                      : sortBy === 'highest-of-the-month'
                      ? 'Highest of the Month'
                      : sortBy === 'highest-of-the-year'
                      ? 'Highest of the Year'
                      : 'Highest of All Time'}
                  </Text>

                  <Image src={SortIcon}></Image>
                </HStack>
              </MenuButton>
              <MenuList
                padding={0}
                border={'0.5px solid black'}
                borderTop={'0px'}
                borderBottom={'0px'}
              >
                <MenuItem
                  backgroundColor={'white'}
                  justifyContent={'center'}
                  padding={0}
                  border={'0.5px solid black'}
                  borderLeft={'0px'}
                  borderRight={'0px'}
                  borderTopRadius={'5px'}
                  fontWeight={'500'}
                  onClick={() => handleSortOptionChange('latest')}
                >
                  Latest
                </MenuItem>
                <MenuItem
                  justifyContent={'center'}
                  border={'0.5px solid black'}
                  borderTop={'0px'}
                  borderLeft={'0px'}
                  borderRight={'0px'}
                  padding={0}
                  fontWeight={'500'}
                  onClick={() => handleSortOptionChange('highest-of-the-week')}
                >
                  Highest of the Week
                </MenuItem>
                <MenuItem
                  justifyContent={'center'}
                  border={'0.5px solid black'}
                  borderTop={'0px'}
                  borderLeft={'0px'}
                  borderRight={'0px'}
                  padding={0}
                  fontWeight={'500'}
                  onClick={() => handleSortOptionChange('highest-of-the-month')}
                >
                  Highest of the Month
                </MenuItem>
                <MenuItem
                  justifyContent={'center'}
                  border={'0.5px solid black'}
                  borderTop={'0px'}
                  borderLeft={'0px'}
                  borderRight={'0px'}
                  padding={0}
                  fontWeight={'500'}
                  onClick={() => handleSortOptionChange('highest-of-the-year')}
                >
                  Highest of the Year
                </MenuItem>
                <MenuItem
                  justifyContent={'center'}
                  border={'0.5px solid black'}
                  borderTop={'0px'}
                  borderBottomRadius={'5px'}
                  borderLeft={'0px'}
                  borderRight={'0px'}
                  padding={0}
                  fontWeight={'500'}
                  onClick={() => handleSortOptionChange('highest-of-all-time')}
                >
                  Highest of All Time
                </MenuItem>
              </MenuList>
            </Menu>
          </VStack>

          <Stack spacing="0px">
            {posts.map((post, index) => (
              <Posts key={index} forumId={id} {...post} />
            ))}
          </Stack>
        </Container>
      )}
    </>
  );
}

export default Forums;
