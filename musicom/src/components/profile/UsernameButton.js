import { Button } from "@chakra-ui/react";
import { PROTECTED } from "lib/routes";
import { Link } from "react-router-dom";

export default function UsernameButton({ user }) {
  return (
    <Button
      as={Link}
      to={`${PROTECTED}/profile/${user?.username}`}
      colorScheme={"#1041B2"}
      variant="link"
      size={{ base: "sm", md: "md" }}
      ml={{ base: "-3", md: "-5" }}
    >
      {user.username}
    </Button>
  );
}
