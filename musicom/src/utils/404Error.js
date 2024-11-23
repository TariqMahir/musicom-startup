import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { DASHBOARD } from 'lib/routes';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <Box pt={20} pl={{ base: "", md: "60" }} width="100%">
        <VStack spacing={6} align="center" maxW="container.lg">
        <Heading
            display="inline-block"
            as="h2"
            size="2xl"
            bgGradient="linear(to-r, blue.400, blue.600)"
            backgroundClip="text"
        >
            404
        </Heading>
        <Text fontSize="18px" mt={3} mb={2}>
            Page Not Found
        </Text>
        <Text color={'gray.500'} mb={6}>
            The page you're looking for does not seem to exist
        </Text>

        <Button
            colorScheme="blue"
            bgGradient="linear(to-r, blue.400, blue.500, blue.600)"
            color="white"
            variant="solid"
            as={Link}
            to={DASHBOARD}
        >
            Go to Home
        </Button>
      </VStack>
    </Box>
  );
}
