import { Box, Text } from "@chakra-ui/react";
import Post from "./index"; // Ensure this path is correct

export default function PostsList({ posts }) {
  return (
    <Box
      px="auto"
      maxW={{ base: "auto", md: "100%" }}
      minW={{ base: "auto", md: "100%" }}
      mx="auto"
      border="none" // Ensure no border is applied
      mt={0} // Remove any margin-top if present
      mb={0} // Remove any margin-bottom if present
    >
      {posts?.length === 0 ? (
        <Text textAlign="center" fontSize="xl">
          No posts yet... Feeling a little lonely here.
        </Text>
      ) : (
        posts?.map((post) => <Post key={post.id} post={post} />)
      )}
    </Box>
  );
}
