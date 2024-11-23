import {
  Flex,
  IconButton,
  Text,
  useColorMode,
  useToast,
} from "@chakra-ui/react";
import { useAuth } from "hooks/auth";
import { useDeletePost, useToggleLike, useRepostPost } from "hooks/posts";
import { useComments } from "hooks/comments";
import {
  FaRegHeart,
  FaHeart,
  FaComment,
  FaRegComment,
  FaTrash,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { FiRepeat } from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";

export default function Actions({ post }) {
  const { id, likes, uid, reposts, date } = post;
  const { user, isLoading: userLoading } = useAuth();
  const isLiked = likes.includes(user?.id);

  const { colorMode } = useColorMode(); // Access the current color mode

  const color = colorMode === "light" ? "#9F9F9F" : "gray.400";

  const config = {
    id,
    isLiked,
    uid: user?.id,
  };
  const { toggleLike, isLoading: likeLoading } = useToggleLike(config);
  const { deletePost, isLoading: deletePostLoading } = useDeletePost(id);
  const { comments, isLoading: commentsLoading } = useComments(id);
  const { repostPost, isLoading: repostLoading } = useRepostPost();
  const toast = useToast();

  // const handleDeletePost = async () => {
  //   try {
  //     await deletePost();
  //   } catch (error) {
  //     toast({
  //       title: "An error occurred while deleting the post.",
  //       description: error.toString(),
  //       status: "error",
  //       isClosable: true,
  //       position: "top",
  //       duration: 5000,
  //     });
  //   }
  // };

  const handleRepost = async () => {
    try {
      const repostUser = user || {};
      await repostPost(post, repostUser);
    } catch (error) {
      console.log(error);
    }
  };

  const isOwnPost = user && user.id === uid; // Check if the post is owned by the logged-in user

  // Calculate the total repost count
  const totalReposts = reposts?.length || 0;

  return (
    <Flex p="2">
      <Flex alignItems="center">
        <IconButton
          onClick={toggleLike}
          isLoading={likeLoading || userLoading}
          size="m"
          colorScheme="blue"
          variant="ghost"
          icon={isLiked ? <FaHeart /> : <FaRegHeart />}
          isRound
        />
        <Text size={"m"} color={color} fontSize={"m"} ml={"1"}>
          {likes.length}
        </Text>
      </Flex>
      {comments && (
        <Flex alignItems="center" ml="3">
          <IconButton
            as={Link}
            to={`/protected/comments/${id}`}
            size="m"
            color="#2e69a7"
            variant="ghost"
            icon={comments.length === 0 ? <FaRegComment /> : <FaComment />}
            isRound
          />
          <Text size={"m"} color={color} fontSize={"m"} ml={1}>
            {comments.length}
          </Text>
        </Flex>
      )}
      <IconButton
        onClick={handleRepost}
        ml="3"
        isLoading={repostLoading || userLoading}
        size="m"
        colorScheme="blue"
        variant="ghost"
        icon={<FiRepeat />}
        isRound
      />
      {totalReposts >= 0 && (
        <Flex alignItems="center" ml="1">
          <Text size={"m"} fontSize={"m"} color={color}>
            {totalReposts}
          </Text>
        </Flex>
      )}
      <Text fontSize="xs" color={color} mt={1} ml={"auto"}>
        {formatDistanceToNow(date)} ago
      </Text>
    </Flex>
  );
}
