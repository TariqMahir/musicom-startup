import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Center,
  Flex,
  Text,
  VStack,
  HStack,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Divider,
  Image,
  InputGroup,
  Input,
} from '@chakra-ui/react';
import { Link, useParams } from 'react-router-dom';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  runTransaction,
  addDoc,
} from 'firebase/firestore';
import { db } from 'lib/firebase';
import BgImage from './assets/forums-bg.svg';
import logoM from 'Musicom Resources/Blue Logo Design/No Background/0.75x/Blue-White Icon Logo copy@0.75x.png';
import UpvoteImg from './assets/upvote.svg';
import DownvoteImg from './assets/downvote.svg';
import CommentImg from './assets/comment.svg';
import ShareImg from './assets/share.svg';
import OptionsImg from './assets/options.svg';
import { useUser } from 'hooks/users';
import { useAuth } from 'hooks/auth';
import { PROTECTED } from 'lib/routes';

const ForumPost = () => {
  const { forumId, postId } = useParams();
  const { user: authUser } = useAuth();
  const [post, setPost] = useState(null);
  const [forum, setForum] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userAvatar, setUserAvatar] = useState(null);
  const [commentAvatars, setCommentAvatars] = useState({});
  const [postUserId, setPostUserId] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [votes, setVotes] = useState(0);
  const [userVote, setUserVote] = useState(null); // Track user's current vote
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postRef = doc(db, 'forums', forumId, 'posts', postId);
        const postSnap = await getDoc(postRef);
        const forumRef = doc(db, 'forums', forumId);
        const forumSnap = await getDoc(forumRef);

        if (postSnap.exists()) {
          setForum(forumSnap.data());
          setPost(postSnap.data());
          setVotes(postSnap.data().upvotes || 0); // Initialize votes

          const userQuery = query(
            collection(db, 'users'),
            where('username', '==', postSnap.data().user)
          );
          const userSnap = await getDocs(userQuery);

          if (!userSnap.empty) {
            const userData = userSnap.docs[0].data();
            setUserAvatar(userData.avatar);
            setPostUserId(userData.id);
          }

          const commentsRef = collection(
            db,
            'forums',
            forumId,
            'posts',
            postId,
            'comments'
          );
          const commentsSnap = await getDocs(commentsRef);
          const commentsList = commentsSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setComments(commentsList);

          const avatars = {};
          for (const comment of commentsList) {
            const userQuery = query(
              collection(db, 'users'),
              where('username', '==', comment.user)
            );
            const userSnap = await getDocs(userQuery);

            if (!userSnap.empty) {
              const userData = userSnap.docs[0].data();
              avatars[comment.id] = userData.avatar; // Store the avatar by comment ID
            }
          }
          setCommentAvatars(avatars);
        } else {
          console.log('No such post!');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [forumId, postId]);

  useEffect(() => {
    if (authUser && postUserId) {
      setIsFollowing(authUser.following.includes(postUserId));
    }
  }, [authUser, postUserId]);

  const handleDownvote = async () => {
    if (!authUser) return; // Ensure user is logged in

    const postDocRef = doc(db, 'forums', forumId, 'posts', postId);
    const userVoteDocRef = doc(db, 'userVotes', `${authUser.id}_${postId}`);

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

  const handleUpvote = async () => {
    if (!authUser) return; // Ensure user is logged in

    const postDocRef = doc(db, 'forums', forumId, 'posts', postId);
    const userVoteDocRef = doc(db, 'userVotes', `${authUser.id}_${postId}`);

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

  const handleCommentSubmit = async () => {
    if (commentText.trim() === '') return;

    try {
      const commentsCollectionRef = collection(
        db,
        'forums',
        forumId,
        'posts',
        postId,
        'comments'
      );

      const newCommentRef = await addDoc(commentsCollectionRef, {
        user: authUser?.username,
        text: commentText,
        createdAt: new Date(),
        upvotes: 0, // Initialize with 0 upvotes
      });

      setComments((prevComments) => [
        ...prevComments,
        {
          id: newCommentRef.id,
          user: authUser?.username,
          avatar: authUser?.avatar,
          text: commentText,
          createdAt: { toDate: () => new Date() },
          upvotes: 0,
        },
      ]);

      setCommentText('');
      setShowCommentInput(false); // Hide comment input after submitting
    } catch (error) {
      console.error('Error adding comment: ', error);
    }
  };

  const handleUpvoteComment = async (commentId) => {
    if (!authUser) return; // Ensure user is logged in

    const commentDocRef = doc(
      db,
      'forums',
      forumId,
      'posts',
      postId,
      'comments',
      commentId
    );
    const userVoteDocRef = doc(
      db,
      'userCommentVotes',
      `${authUser.id}_${commentId}`
    );

    try {
      const newVoteData = await runTransaction(db, async (transaction) => {
        const commentDoc = await transaction.get(commentDocRef);
        const userVoteDoc = await transaction.get(userVoteDocRef);

        if (!commentDoc.exists()) {
          throw new Error('Comment does not exist!');
        }

        const currentVotes = commentDoc.data().upvotes || 0;
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

        transaction.update(commentDocRef, { upvotes: newVotes });
        if (newUserVote) {
          transaction.set(userVoteDocRef, { voteType: newUserVote });
        } else {
          transaction.delete(userVoteDocRef);
        }

        return { newVotes, newUserVote };
      });

      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? { ...comment, upvotes: newVoteData.newVotes }
            : comment
        )
      );
    } catch (error) {
      console.error('Error updating comment vote: ', error);
    }
  };

  const handleDownvoteComment = async (commentId) => {
    if (!authUser) return; // Ensure user is logged in

    const commentDocRef = doc(
      db,
      'forums',
      forumId,
      'posts',
      postId,
      'comments',
      commentId
    );
    const userVoteDocRef = doc(
      db,
      'userCommentVotes',
      `${authUser.id}_${commentId}`
    );

    try {
      const newVoteData = await runTransaction(db, async (transaction) => {
        const commentDoc = await transaction.get(commentDocRef);
        const userVoteDoc = await transaction.get(userVoteDocRef);

        if (!commentDoc.exists()) {
          throw new Error('Comment does not exist!');
        }

        const currentVotes = commentDoc.data().upvotes || 0;
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

        transaction.update(commentDocRef, { upvotes: newVotes });
        if (newUserVote) {
          transaction.set(userVoteDocRef, { voteType: newUserVote });
        } else {
          transaction.delete(userVoteDocRef);
        }

        return { newVotes, newUserVote };
      });

      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? { ...comment, upvotes: newVoteData.newVotes }
            : comment
        )
      );
    } catch (error) {
      console.error('Error updating comment vote: ', error);
    }
  };

  if (loading) {
    return <Center>Loading...</Center>;
  }

  if (!post) {
    return <Center>No post found.</Center>;
  }

  return (
    <Box
      backgroundImage={`url(${BgImage})`}
      backgroundRepeat="no-repeat"
      backgroundSize="cover"
      minHeight={'100vh'}
      height="fit-content"
      display={'flex'}
      justifyContent={'center'}
      mb={5}
    >
      <VStack
        mt="30px"
        backgroundColor="white"
        width="750px"
        minH={'100vh'}
        border={'1px solid #E2E8F0'}
        borderRadius="md"
      >
        <Box
          mt={'25px'}
          border={'1px solid #E2E8F0'}
          borderRadius="md"
          width={'700px'}
          mb={5}
        >
          <HStack justifyContent={'space-between'} padding={'10px'}>
            <Text color={'#6899FE'} fontSize={'20px'} fontWeight={'500'}>
              {forum?.title}
            </Text>
            {forum?.members?.includes(authUser?.id) && (
              <Button
                backgroundColor={'#16AA1C'}
                color={'white'}
                border={'1px solid #9F9F9F'}
                borderRadius={'5px'}
                size="sm"
                mt="3"
                mb="3"
                _hover={{
                  backgroundColor: '#23ba29',
                }}
              >
                Join
              </Button>
            )}
          </HStack>

          <Divider mt="2" mb="2" />

          <HStack justifyContent="space-between" padding={'10px'}>
            <HStack>
              <Avatar size="md" src={userAvatar || logoM} />
              <VStack alignItems={'flex-start'}>
                <Text fontSize="16px" fontWeight="600" color="black">
                  {post.user}
                </Text>
                <Text
                  fontSize="8px"
                  color="#9F9F9F"
                  whiteSpace={'nowrap'}
                  mt={-1}
                >
                  {new Date(post.createdAt.toDate()).toLocaleString()}
                </Text>
              </VStack>
            </HStack>
            <VStack mt={0}>
              <Menu>
                <MenuButton
                  as={IconButton}
                  background={'white'}
                  backgroundImage={OptionsImg}
                  backgroundRepeat={'no-repeat'}
                  backgroundPosition={'center'}
                  backgroundSize={'20px'}
                  _hover={{
                    background: 'white',
                    backgroundImage: `${OptionsImg}`,
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
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    padding={'0px'}
                  >
                    Delete Post
                  </MenuItem>
                </MenuList>
              </Menu>
              <Flex
                justifyContent="flex-end"
                alignItems="center"
                width="100%"
                mt={-3}
              >
                <IconButton
                  background={'white'}
                  backgroundImage={ShareImg}
                  backgroundRepeat={'no-repeat'}
                  backgroundPosition={'center'}
                  backgroundSize={'20px'}
                  _hover={{
                    backgroundImage: `${ShareImg}`,
                  }}
                />
              </Flex>
            </VStack>
          </HStack>

          <Text
            m={'5px 0'}
            ml={'5px'}
            mt={-2}
            fontSize={'24px'}
            fontWeight={'700'}
          >
            {post.postTitle}
          </Text>
          {post.imageUrl && (
            <Image
              src={post.imageUrl}
              height={'150px'}
              ml={'5px'}
              minWidth={'150px'}
              maxWidth={'200px'}
              justifyContent={'center'}
              alignItems={'center'}
              borderRadius="md"
              objectFit="cover"
              mb={'10px'}
            />
          )}
          <VStack alignItems={'flex-start'}>
            <Text
              fontSize="14px"
              fontWeight={'300'}
              ml={'5px'}
              mb={3}
              color={'#696969'}
            >
              {post.post}
            </Text>
          </VStack>

          <HStack spacing="1" ml={'5px'}>
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
                ml={'10px'}
                background={'white'}
                backgroundImage={CommentImg}
                backgroundRepeat={'no-repeat'}
                backgroundPosition={'center'}
                backgroundSize={'15px'}
                onClick={() => setShowCommentInput((prev) => !prev)}
                _hover={{
                  backgroundImage: `${CommentImg}`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              />
            </VStack>
            <Text fontSize={'sm'} cursor="pointer">
              {comments.length}
            </Text>
          </HStack>

          <Divider mt="2" mb="4" />
          {showCommentInput && (
            <InputGroup mt="2" mb="4">
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
          )}
          <VStack
            alignItems="flex-start"
            spacing="4"
            width="95%"
            ml={'2.5%'}
            mb={1}
          >
            {comments
              .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate())
              .map((comment) => (
                <Box
                  key={comment.id}
                  p="4"
                  borderWidth="1px"
                  borderRadius="md"
                  width="100%"
                >
                  <HStack>
                    <Avatar
                      size="sm"
                      src={
                        comment.avatar
                          ? comment.avatar
                          : commentAvatars[comment.id] || logoM
                      }
                    />
                    <VStack alignItems={'start'}>
                      <Button
                        color="black"
                        fontSize={'16px'}
                        fontWeight="600"
                        variant="link"
                        as={Link}
                        to={`${PROTECTED}/profile/${comment.user}`}
                      >
                        {comment.user}
                      </Button>
                      <Text fontSize="8px" color="gray.500" mt={-1}>
                        {new Date(comment.createdAt.toDate()).toLocaleString()}
                      </Text>
                    </VStack>
                  </HStack>
                  <Text mt="2">{comment.text}</Text>
                  <HStack spacing="1" ml={'5px'}>
                    <IconButton
                      background={'white'}
                      backgroundImage={UpvoteImg}
                      backgroundRepeat={'no-repeat'}
                      backgroundPosition={'center'}
                      backgroundSize={'15px'}
                      onClick={() => handleUpvoteComment(comment.id)}
                      _hover={{
                        backgroundImage: `${UpvoteImg}`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                      }}
                    />
                    <Text fontSize="sm" fontWeight="bold" textAlign="center">
                      {comment.upvotes ? comment.upvotes : 0}
                    </Text>
                    <IconButton
                      background={'white'}
                      backgroundImage={DownvoteImg}
                      backgroundRepeat={'no-repeat'}
                      backgroundPosition={'center'}
                      backgroundSize={'15px'}
                      onClick={() => handleDownvoteComment(comment.id)}
                      _hover={{
                        backgroundImage: `${DownvoteImg}`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                      }}
                    />
                    {/* <VStack>
                      <Button
                        ml={'10px'}
                        background={'white'}
                        backgroundImage={CommentImg}
                        backgroundRepeat={'no-repeat'}
                        backgroundPosition={'center'}
                        backgroundSize={'15px'}
                        onClick={() => setShowCommentInput((prev) => !prev)}
                        _hover={{
                          backgroundImage: `${CommentImg}`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                        }}
                      />
                    </VStack> */}
                    {/* <Text fontSize={'sm'} cursor="pointer">
                      {comments.length}
                    </Text> */}
                  </HStack>
                </Box>
              ))}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default ForumPost;
