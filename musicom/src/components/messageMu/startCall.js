import { AtSignIcon, SearchIcon } from "@chakra-ui/icons";
import {
  Avatar,
  Box,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Tag,
  TagCloseButton,
  TagLabel,
  TagLeftIcon,
  Text,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { Button } from "react-chat-engine";
import { useForm } from "react-hook-form";
import { usernameValidate } from "utils/form-validate";
import { CallElement } from "./callElement";
import { MembersList } from "./buttons";
const Search = () => {
  return (
    <InputGroup borderRadius={"xl"} backgroundColor={"transparent"}>
      <InputLeftElement pointerEvents="none">
        <SearchIcon color="gray.300" />
      </InputLeftElement>
      <Input type="text" placeholder="Search..." color={"black"} />
    </InputGroup>
  );
};
const StartCall = ({ open, handleClose }) => {
  const initialRef = useRef(null);
  const finalRef = useRef(null);
  const [input, setInput] = useState("");

  const handleInputChange = (e) => setInput(e.target.value);

  const isError = input === "";

  return (
    <Modal
      initialFocusRef={initialRef}
      finalFocusRef={finalRef}
      isOpen={open}
      onClose={handleClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Start Call</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Stack spacing={3}>
            <Stack width={"100%"} mb={3}>
              <Search />
            </Stack>
            {MembersList.map((el) => (
              <CallElement {...el} />
            ))}
          </Stack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default StartCall;
