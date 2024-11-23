import {
  Avatar,
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  HStack,
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
  Select,
  Spinner,
  Stack,
  Switch,
  Text,
  VStack,
  useBreakpointValue,
  useColorMode,
  useToast,
} from "@chakra-ui/react";
import { useAuth } from "hooks/auth";
import React, { useEffect, useRef, useState } from "react";
import { FaFileAudio } from "react-icons/fa";
import { FiFile, FiTriangle } from "react-icons/fi";
import { ConnectWallet } from "@thirdweb-dev/react";
import { useContract, useContractWrite } from "@thirdweb-dev/react";
import { useAddress, useWallet, useBalance } from "@thirdweb-dev/react";
import { NATIVE_TOKEN_ADDRESS } from "@thirdweb-dev/sdk";
import { ethers, utils } from "ethers";
import { Goerli } from "@thirdweb-dev/chains";
import { Web3Button } from "@thirdweb-dev/react";
import logoM from "Musicom Resources/Blue Logo Design/No Background/0.75x/Blue-White Icon Logo copy@0.75x.png";
import { PROTECTED } from "lib/routes";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  doc,
  getDoc,
  where,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "lib/firebase";
import { SearchIcon } from "@chakra-ui/icons";
import { getIDfromUsername, useUsername } from "hooks/users";
import { useNotifications } from "hooks/notifications";
import {
  getDownloadURL,
  getMetadata,
  getStorage,
  ref,
  updateMetadata,
  uploadBytes,
} from "firebase/storage";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import ReactAudioPlayer from "react-audio-player";
import { Link } from "react-router-dom";
//import { AudioPlayer } from "musicom/src/components/messageMu/player.js";
import AudioPlayer from "components/messageMu/player.js";


const AudioPreviewPlayer = ({ fileUrl, state }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div>
      <ReactAudioPlayer
        src={fileUrl}
        autoPlay={false} // Auto-play is set to false to control play/pause manually
        controls // Show audio controls (play, pause, volume)
        onContextMenu={(e) => {
          if (state) e.preventDefault();
        }}
        controlsList={state ? "nodownload" : ""} // Disable download option
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};

const ConnectUserModal = ({ isOpen, onClose, onConnect, authUsername, userId, authUserId }) => {
  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null); // Add user state
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const { user: authUser } = useAuth();
  const fetchUsers = async (searchQuery) => {
    const search = searchQuery.toLowerCase();
    try {
      const q = query(
        collection(db, "users"),
        where("username", ">=", search),
        where("username", "<=", search + "\uf8ff"),
        where("username", "!=", authUser.username)
      );
      const busQ = query(
        collection(db, "businesses"),
        where("username", ">=", search),
        where("username", "<=", search + "\uf8ff"),
        where("username", "!=", authUser.username)
      );
      const querySnapshot = await getDocs(q);
      const businessQuerySnapshot = await getDocs(busQ);
      const users = [
        ...querySnapshot.docs.map((doc) => doc.data()),
        ...businessQuerySnapshot.docs.map((doc) => doc.data()),
      ];
      setUserResults(users);
      setSearchResults(users);

      // Set the user state to the first result (if available)
      if (users.length > 0) {
        setUser(users[0]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setSearchQuery(inputValue);
    if (inputValue) {
      fetchUsers(inputValue);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchResultClick = (result, index) => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedResultIndex(index);
    setUser(result);
    setSearchQuery(result.username);
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      if (selectedResultIndex !== -1 && searchResults.length > 0) {
        const username = searchResults[selectedResultIndex];
        setSearchQuery("");
        setSearchResults([]);
        setSelectedResultIndex(-1);
        setUser(username);
        setSearchQuery(username.username);
      } else {
        const username = searchQuery.trim();
        setSearchQuery(username);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedResultIndex((prevIndex) => {
        if (prevIndex === -1) {
          return searchResults.length - 1;
        } else {
          return Math.max(prevIndex - 1, -1);
        }
      });
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedResultIndex((prevIndex) => {
        if (prevIndex === searchResults.length - 1) {
          return -1;
        } else {
          return Math.min(prevIndex + 1, searchResults.length - 1);
        }
      });
    } else if (event.key === "Escape") {
      setSearchResults([]);
      setSelectedResultIndex(-1);
    } else {
      setSelectedResultIndex(-1); // Reset selected result index when a new key is pressed
    }
  };
  const { sendNotification } = useNotifications();

  if (!customElements.get('audio-player')) {
    customElements.define('audio-player', AudioPlayer);
  }

  

  const handleConnect = async () => {
    try {
      // Create a new session document in Firestore
      const sessionsCollection = collection(db, "sessions");
      const sessionsQuery = query(sessionsCollection);
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionsCount = sessionsSnapshot.size;
      const newSession = {
        listId: sessionsCount + 1,
        frusername: searchQuery.trim(), // The selected user's username
        authUser: authUsername, // The authenticated user's username
        fileURL: "", // Add the file URL here
        priceExchanged: 0, // Add the price exchanged here
        status: `awaiting ${searchQuery.trim()} approval`,
        createdAt: Date.now(),
        buyer: "",
        seller: "",
        type: "",
        confirmedExchange: false,
      };
      // Add the new session to Firestore
      const sessionDocRef = await addDoc(sessionsCollection, newSession);
      await sendNotification({
        title: "New PayMu Request",
        content: `@${authUsername} sent you a paymu request.`,
        uid: await getIDfromUsername(searchQuery.trim()),
        from: authUser?.id,
        type: "paymu",
        time: Date.now(),
      });
      // Show success message
      toast({
        title: "Connection Request Sent",
        description: `You have sent a connection request to ${searchQuery.trim()}.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      const notificationSnapshot = await getDocs(
        query(
          collection(db, "notifications"),
          where("uid", "==", userId),
          where("type", "==", "paymu"),
          where("from", "==", authUserId)
        )
      );
    
      if (notificationSnapshot.size > 0) {
        notificationSnapshot.docs.forEach((docSnapshot) => {
          deleteDoc(doc(db, "notifications", docSnapshot.id));
        });
      }
      // window.location.href = `${PROTECTED}/paymu/${searchQuery.trim()}/${
      //   sessionDocRef.id
      // }`;
      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error sending connection request:", error);
      toast({
        title: "Error",
        description: "Failed to send connection request.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const { colorMode, toggleColorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Session</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl>
            <FormLabel>Username</FormLabel>
            <InputGroup>
              <InputLeftElement>
                <Avatar
                  src={user?.avatar || logoM}
                  size={isMobile ? "xs" : "sm"}
                  mb={isMobile && 2}
                />
              </InputLeftElement>
              <Input
                flex="1"
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                size={{ base: "sm", md: "md" }}
                fontSize="md"
                borderWidth={1}
                borderColor={"gray.300"}
                borderStyle={"solid"}
                _focus={{ outline: "none" }}
                maxWidth={"auto"}
                //placeholder={"@" + (user?.username || "alelentini")}
              />
            </InputGroup>

            {searchResults.length > 0 && (
              <Box
                mt={2}
                p={2}
                borderRadius="md"
                boxShadow="md"
                backgroundColor={colorMode === "light" ? "white" : "gray.700"}
                color={colorMode === "light" ? "black" : "white"}
                zIndex={1}
                width="auto"
              >
                {searchResults.map((result, index) => (
                  <Box
                    key={result.id}
                    onClick={() => handleSearchResultClick(result, index)}
                    cursor="pointer"
                    py={1}
                    px={2}
                    bg={
                      selectedResultIndex === index ? "gray.200" : "transparent"
                    }
                    _hover={{ background: "gray.200" }}
                    display="flex"
                    alignItems="center"
                  >
                    <Avatar
                      size="sm"
                      border="2px solid #1041B2"
                      src={result.avatar}
                    />
                    <Text ml="2">{result.username}</Text>
                  </Box>
                ))}
              </Box>
            )}
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleConnect}>
            Request
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// async function getSessionById(sessionId) {
//   console.log("sessionId", sessionId);
//   try {
//     const sessionRef = doc(db, "sessions", sessionId);
//     const sessionSnapshot = await getDoc(sessionRef);

//     if (sessionSnapshot.exists()) {
//       const sessionData = sessionSnapshot.data();
//       // Do something with the session data
//       console.log("Session Data:", sessionData);
//       return sessionData;
//     } else {
//       console.log("No such session document!");
//       return null;
//     }
//   } catch (error) {
//     console.error("Error getting session:", error);
//     return null;
//   }
// }

const Avatarr = ({ username, isMobile }) => {
  const { user } = useUsername(username);

  return <Avatar src={user?.avatar} size={isMobile ? "2xs" : "sm"} />;
};

const PayMu = () => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user, isLoading: isLoadinggg } = useAuth();
  useEffect(() => {
    if (!user) console.log("User not found");
  }, [user]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileLink, setFileLink] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    handleUpload(file, user?.id);
  };
  const [amount, setAmount] = useState("");
  const handleAmountChange = (event) => {
    const inputValue = event.target.value.replace(/[^0-9]/g, "");

    setAmount(inputValue);
  };

  const handleUpload = async (file, uid) => {
    const fileRef = ref(storage, "paymufiles/" + uid + "/" + file.name);

    try {
      await uploadBytes(fileRef, file);
      // Update the metadata to set the content type as image/jpeg
      const metadata = { contentType: file.type, name: file.name };
      await updateMetadata(fileRef, metadata);

      const fileUrl = await getDownloadURL(fileRef);
      setFileLink(fileUrl);
    } catch (error) {
      console.log("Error:", error);
    }
  };

  const inputWidth = useBreakpointValue({ base: "100%", md: "200px" });
  const [showAdditionalInputGroup, setShowAdditionalInputGroup] =
    useState(false);

  const handleSwitchChange = () => {
    setShowAdditionalInputGroup(!showAdditionalInputGroup);
  };

  const [showAdditionalInputGroup2, setShowAdditionalInputGroup2] =
    useState(false);

  const handleSwitchChange2 = () => {
    setShowAdditionalInputGroup2(!showAdditionalInputGroup2);
  };

  const { colorMode, toggleColorMode } = useColorMode();
  const address = useAddress();
  const wallet = useWallet();
  const tokenAddress = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";
  const { data, isLoading: balanceLoading } = useBalance(tokenAddress);

  const [authUsername, setAuthUsername] = useState("");
  const [loadingg, setLoadingg] = useState(false);
  useEffect(() => {
    if (!isLoadinggg && user && user.username) {
      setAuthUsername(user.username);
    }
  }, [isLoadinggg, user]);

  // const erc20Balance = wallet.getBalance(
  //   "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  // );
  // const walletBalance = wallet.getBalance();

  const { contract } = useContract(
    "0xd70eC985b47274ba1204c71D1C399F857725B49A"
  );
  const { mutateAsync: addFile, isLoading } = useContractWrite(
    contract,
    "addFile"
  );
  const [loading, setLoading] = useState(false);
  const addFileButton = async (_id, _price, _buyer) => {
    console.log(_buyer);
    console.log(utils.getAddress(_buyer));

    try {
      setLoading(true);
      // Assuming addFile is an asynchronous function that returns a Promise
      const data = await addFile({
        args: [
          _id,
          ethers.utils.parseUnits(_price, 6),
          utils.getAddress(_buyer),
        ],
      });

      setLoading(false);
      console.log(data);
      console.info("Contract call success", data);
      handleApprove(
        sessionFetched?.id,
        sessionFetched?.authUser,
        sessionType || sessionFetched?.type,
        fileUrl,
        sessionFetched?.buyer,
        sessionFetched?.priceExchanged,
        sessionFetched?.seller,
        true,
        true
      );
    } catch (err) {
      setLoading(false);
      console.error("Contract call failure", err);
    }
  };

  const { mutateAsync: buyFile, isLoading: buyFileLoading } = useContractWrite(
    contract,
    "buyFile"
  );

  const { mutateAsync: confirm, isLoading: confirmLoading } = useContractWrite(
    contract,
    "confirm"
  );

  const { mutateAsync: withdraw, isLoading: withdrawLoading } =
    useContractWrite(contract, "withdraw");

  const { contract: usdcContract } = useContract(
    "0x07865c6E87B9F70255377e024ace6630C1Eaa37F"
  );
  const { mutateAsync: approve, isLoading: usdcLoading } = useContractWrite(
    usdcContract,
    "approve"
  );

  // const { mutateAsync: increaseAllowance, isLoading: isLoadingAllowance } =
  //   useContractWrite(usdcContract, "increaseAllowance");

  const usdcApprove = async (spender, value) => {
    try {
      const data = await approve({ args: [spender, value] });
      console.info("contract call successs", data);
    } catch (err) {
      console.error("contract call failure", err);
    }
  };

  // const increaseAllowanceCall = async (spender, increment) => {
  //   try {
  //     const data = await increaseAllowance({ args: [spender, increment] });
  //     console.info("contract call successs", data);
  //   } catch (err) {
  //     console.error("contract call failure", err);
  //   }
  // };

  const buyButtonCall = async (_id) => {
    // try {
    //   const data = await buyFile({ args: [utils.parseUnits(_id, 0)] });
    //   console.info("contract call successs", data);
    // } catch (err) {
    //   console.error("contract call failure", err);
    // }
    // console.log((await wallet.getAddress()).toString());
    // console.log(ethers.utils.parseUnits(_id, 0).toString());
    try {
      setLoading(true);
      await usdcApprove(
        contract.getAddress(),
        ethers.utils.parseUnits(sessionFetched?.priceExchanged, 6)
      );
      // await increaseAllowanceCall(
      //   wallet.getAddress(),
      //   ethers.utils.parseEther("200")
      // );
      const data = await buyFile({ args: [_id] });

      setLoading(false);
      console.log(data);
      console.info("Contract call success", data);
      handleApprove(
        sessionFetched?.id,
        sessionFetched?.authUser,
        sessionType || sessionFetched?.type,
        fileUrl,
        sessionFetched?.buyer,
        sessionFetched?.priceExchanged,
        sessionFetched?.seller,
        true,
        true,
        true
      );
    } catch (err) {
      setLoading(false);
      console.error("Contract call failure", err);
    }
  };

  const confirmButtonCall = async (_id) => {
    try {
      setLoading(true);

      const data = await confirm({ args: [_id] });

      setLoading(false);
      console.log(data);
      console.info("Contract call success", data);
      handleApprove(
        sessionFetched?.id,
        sessionFetched?.authUser,
        sessionType || sessionFetched?.type,
        fileUrl,
        sessionFetched?.buyer,
        sessionFetched?.priceExchanged,
        sessionFetched?.seller,
        true,
        true,
        true,
        true
      );
    } catch (err) {
      setLoading(false);
      console.error("Contract call failure", err);
    }
  };

  const withdrawButtonCall = async () => {
    try {
      setLoading(true);

      const data = await withdraw({ args: [] });

      setLoading(false);
      console.log(data);
      console.info("Contract call success", data);
      handleApprove(
        sessionFetched?.id,
        sessionFetched?.authUser,
        sessionType || sessionFetched?.type,
        fileUrl,
        sessionFetched?.buyer,
        sessionFetched?.priceExchanged,
        sessionFetched?.seller,
        true,
        true,
        true,
        true,
        true
      );
    } catch (err) {
      setLoading(false);
      console.error("Contract call failure", err);
    }
  };

  const [isConnectModalOpen, setConnectModalOpen] = useState(false);

  const handleConnectClick = () => {
    setConnectModalOpen(true);
  };

  const handleConnectModalClose = () => {
    setConnectModalOpen(false);
  };

  const [sessions, setSessions] = useState([]);
  const sessionsCollection = query(
    collection(db, "sessions") //,
    // where("authUser", "==", authUsername)
  );

  // Create a function to handle changes in the sessions collection
  const handleSessionsUpdate = (snapshot) => {
    const sessions = [];
    snapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    setSessions(sessions);
    // Update your state or perform any actions with the updated sessions
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(sessionsCollection, handleSessionsUpdate);

    // Return a cleanup function to unsubscribe when the component unmounts
    return () => {
      unsubscribe();
    };
  }, [authUsername]);

  const urlParts = window.location.toString().split("/");
  const sessionId =
    urlParts[urlParts.length - 1] !== "paymu"
      ? urlParts[urlParts.length - 1]
      : 0;

  const frusername =
    urlParts[urlParts.length - 2] !== "protected"
      ? urlParts[urlParts.length - 2]
      : 0;

  const [sessionFetched, setSessionFetched] = useState(null);

  useEffect(() => {
    if (sessionId) {
      const sessionDocRef = doc(db, "sessions", sessionId);

      const unsubscribe = onSnapshot(sessionDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const sessionData = docSnapshot.data();
          setSessionFetched({ ...sessionData, id: docSnapshot.id });
        } else {
          console.log("Session does not exist");
          setSessionFetched(null);
          if (sessionId !== 0 && frusername !== 0) {
            setTimeout(() => {
              window.location.href = `${PROTECTED}/paymu`;
            }, 2000);
          }
        }
      });

      // Cleanup function to unsubscribe from the snapshot listener
      return () => unsubscribe();
    }
  }, [sessionId]);

  const [fileType, setFileType] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);

  const getFileType = async (url) => {
    try {
      const storage = getStorage(); // Initialize Firebase Storage

      const fileRef = ref(storage, url);
      const metadata = await getMetadata(fileRef);
      return metadata.contentType;
    } catch (error) {
      console.error("Error getting file type:", error);
      return null;
    }
  };

  useEffect(() => {
    if (sessionFetched?.fileURL) {
      getFileType(sessionFetched.fileURL)
        .then((contentType) => {
          setFileType(contentType);
          // Set the file URL
          setFileUrl(sessionFetched.fileURL);
        })
        .catch((error) => {
          console.error("Error getting file type:", error);
        });
    }
  }, [sessionFetched]);

  const renderFilePreview = (state) => {
    if (fileType && fileUrl) {
      if (fileType.startsWith("image/")) {
        // Display image preview
        return (
          <div
            style={{
              position: "relative",
              display: "inline-block",
            }}
          >
            <img
              src={fileUrl}
              alt="File"
              style={{ width: "640px", height: "auto" }}
              onContextMenu={(e) => {
                if (state) e.preventDefault();
              }}
            />
            {state && (
              <>
                <div
                  style={{
                    position: "absolute",
                    bottom: "50%",
                    right: "40%",
                    color: "white",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    padding: "5px",
                    fontSize: "20px",
                  }}
                >
                  MUSICOM™
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "50%",
                    right: "10%",
                    color: "white",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    padding: "5px",
                    fontSize: "20px",
                  }}
                >
                  MUSICOM™
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "50%",
                    right: "70%",
                    color: "white",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    padding: "5px",
                    fontSize: "20px",
                  }}
                >
                  MUSICOM™
                </div>
              </>
            )}
          </div>
        );
      } else if (fileType.startsWith("video/")) {
        return (
          <div style={{ position: "relative" }}>
            <video
              controls
              width="640"
              height="360"
              onContextMenu={(e) => {
                if (state) e.preventDefault();
              }}
            >
              <source src={fileUrl} type="video/mp4" />
            </video>
            {state && (
              <>
                <div
                  style={{
                    position: "absolute",
                    bottom: "50%",
                    right: "40%",
                    color: "white",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    padding: "5px",
                    fontSize: "20px",
                  }}
                >
                  MUSICOM™
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "50%",
                    right: "10%",
                    color: "white",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    padding: "5px",
                    fontSize: "20px",
                  }}
                >
                  MUSICOM™
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "50%",
                    right: "70%",
                    color: "white",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    padding: "5px",
                    fontSize: "20px",
                  }}
                >
                  MUSICOM™
                </div>
              </>
            )}
          </div>
        );
      } else if (fileType.startsWith("audio/")) {
        return <AudioPreviewPlayer fileUrl={fileUrl} state={state} />;
      } else if (fileType === "application/pdf") {
        // Display PDF preview in an iframe
        return (
          <iframe
            src={fileUrl}
            width="100%"
            height="500px"
            frameBorder="0"
            title="PDF Preview"
          ></iframe>
        );
      } else if (fileType === "application/vnd.openxmlformats-officedocument") {
        // Display PPT presentation in an iframe
        return (
          <>
            <Text>Preview</Text>
            <DocViewer
              documents={[{ uri: fileUrl }]}
              initialActiveDocument={0} // Set the initialActiveDocument to 0 or the appropriate index
              pluginRenderers={DocViewerRenderers}
            />
          </>
        );
      } else {
        const regex = /\/([^/]+)\?/;

        let fille = "";
        const matches = fileUrl.match(regex);
        if (matches && matches.length > 1) {
          const filePath = matches[1];
          const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
          fille = decodeURIComponent(fileName.split("%2F").pop());
        }

        // Handle other file types or show a message
        return <Text>File ({fille})Preview not available... </Text>;
      }
    } else {
      return null;
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      // Reference to the session document
      const sessionRef = doc(db, "sessions", sessionId);

      // Delete the document
      await deleteDoc(sessionRef);

      console.log(`Document with ID ${sessionId} successfully deleted.`);
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const { sendNotification } = useNotifications();

  const handleApprove = async (
    sessionId = "",
    frusername = "",
    sessionType = "",
    fileLink = "",
    buyer = "",
    amount = "",
    seller = "",
    approveAmount = false,
    fileOnBlock = false,
    payed = false,
    confirmed = false,
    sellerWithdraw = false
  ) => {
    try {
      // Reference to the session document
      const sessionRef = doc(db, "sessions", sessionId);

      // Update the session document
      await updateDoc(sessionRef, {
        confirmedExchange: sellerWithdraw,
        type: sessionType,
        status:
          sessionFetched?.status === `awaiting ${authUsername} approval`
            ? "choose type of exchange"
            : sessionFetched?.status === "choose type of exchange"
            ? `approve exchange type: ${sessionType}`
            : !fileLink
            ? `approve ${
                sessionType === "buy file"
                  ? `buying file from ${authUsername}`
                  : `selling file to ${authUsername}`
              }`
            : fileLink && !buyer && !amount
            ? `approve file from ${authUsername}`
            : fileLink && buyer && !amount && !approveAmount && !fileOnBlock
            ? `file approved`
            : fileLink &&
              buyer &&
              amount &&
              seller &&
              !approveAmount &&
              !fileOnBlock &&
              !payed
            ? "approve amount"
            : approveAmount && !fileOnBlock && !payed && !confirmed
            ? "confirm file on blockchain"
            : fileOnBlock && !payed && !confirmed && !sellerWithdraw
            ? "pay on blockchain"
            : payed && !confirmed && !sellerWithdraw
            ? "confirm file received"
            : confirmed && !sellerWithdraw
            ? `withdraw your balance`
            : sellerWithdraw
            ? `completed`
            : `accept payment`,
        fileURL: fileLink || "",
        buyer: buyer || "",
        priceExchanged: amount || "",
        seller: seller || "",
      });

      // Send notification to the other user
      await sendNotification({
        title: "Your exchange has been approved",
        content: `@${authUsername} accepted your exchange.`,
        uid: await getIDfromUsername(frusername),
        from: user?.id,
        type: "paymu",
        time: Date.now(),
      });
    } catch (error) {
      console.error("Error approving session:", error);
    }
  };

  const handleDeny = async (sessionId, frusername) => {
    console.log(sessionId, frusername);
    try {
      // Reference to the session document
      const sessionRef = doc(db, "sessions", sessionId);

      // Delete the session document
      await deleteDoc(sessionRef);

      // Send notification to the other user
      await sendNotification({
        title: "Your exchange has been denied",
        content: `@${authUsername} denied your exchange.`,
        uid: await getIDfromUsername(frusername),
        from: user?.id,
        type: "paymu",
        time: Date.now(),
      });

      //window.location.href = `${PROTECTED}/paymu`;
    } catch (error) {
      console.error("Error denying session:", error);
    }
  };

  const handleDownloadClick = (event) => {
    event.preventDefault(); // Prevent default link behavior

    if (sessionFetched?.fileURL) {
      // Create a new window or tab
      const newWindow = window.open(sessionFetched.fileURL, "_blank");
    } else {
      // Handle the case where popups are blocked
      console.log("Unable to open a new window. Popups might be blocked.");
    }
  };

  const [sessionType, setSessionType] = useState("");
  return (
    <Center pt={20} width={isMobile ? "100%" : "100vw"}>
      <VStack justifyContent="center" spacing={10}>
        <HStack justifyContent={"space-between"} spacing={20}>
          {address && !isMobile && (
            <ConnectWallet
              style={{
                marginLeft: sessions.length > 0 && 40,
                marginRight: sessions.length > 0 && -40,
              }}
              theme={colorMode}
              btnTitle={"Connect to PayMu"}
              displayBalanceToken={{
                [Goerli.chainId]: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F", //USDC
              }}
              dropdownPosition={{
                side: "bottom", //  "top" | "bottom" | "left" | "right";
                align: "end", // "start" | "center" | "end";
              }}
            />
          )}
          <VStack
            spacing={1}
            align="center"
            mr={
              address
                ? sessions.length > 0 && frusername === 0 && sessionId === 0
                  ? isMobile
                    ? 0
                    : 20
                  : isMobile
                  ? 0
                  : 60
                : 0
            }
            ml={
              address
                ? sessions.length > 0 &&
                  !isMobile &&
                  frusername === 0 &&
                  sessionId === 0 &&
                  20
                : 0
            }
          >
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color="#1041B2"
              textAlign="center"
            >
              PayMu
            </Text>
            <Text fontSize="lg" textAlign="center">
              Safely & Securely
            </Text>
            {address && isMobile && (
              <ConnectWallet
                theme={colorMode}
                btnTitle={"Connect to PayMu"}
                displayBalanceToken={{
                  [Goerli.chainId]:
                    "0x07865c6E87B9F70255377e024ace6630C1Eaa37F", //USDC
                }}
                dropdownPosition={{
                  side: "bottom", //  "top" | "bottom" | "left" | "right";
                  align: "end", // "start" | "center" | "end";
                }}
              />
            )}
          </VStack>
          {address &&
            sessions.length > 0 &&
            !isMobile &&
            frusername === 0 &&
            sessionId === 0 && (
              <Button
                onClick={handleConnectClick}
                marginLeft={-10}
                marginRight={10}
              >
                New Session
              </Button>
            )}
        </HStack>
        {address &&
          sessions.length > 0 &&
          isMobile &&
          !isLoadinggg &&
          frusername === 0 &&
          sessionId === 0 && (
            <Button onClick={handleConnectClick}>New Session</Button>
          )}
        {address && !isLoadinggg && frusername === 0 && sessionId === 0 && (
          <Box>
            {/* Display the list of sessions */}
            {sessions.length > 0 ? (
              sessions
                .slice()
                .reverse()
                .sort((a, b) => a.listId - b.listId) // Sort sessions in descending order by id
                .map(
                  (session) =>
                    (session.authUser === authUsername ||
                      session.frusername === authUsername) && (
                      <HStack>
                        <Box
                          key={session.listId}
                          border="1px"
                          borderRadius={isMobile ? 10 : 20}
                          width={"100%"}
                          p={isMobile ? 1 : 4}
                          mb={2}
                          backgroundColor={
                            session.status === "completed" && "gray.300"
                          }
                        >
                          <HStack spacing={10} justifyContent={"space-between"}>
                            <HStack spacing={10}>
                              <Avatarr
                                username={
                                  session.frusername === authUsername
                                    ? session.authUser
                                    : session.frusername
                                }
                                isMobile={isMobile}
                              />
                              <Text
                                fontWeight="bold"
                                fontSize={isMobile && 10}
                                ml={-8}
                              >
                                {session.frusername === authUsername
                                  ? session.authUser
                                  : session.frusername}
                              </Text>
                            </HStack>
                            <Text fontSize={isMobile && 10}>
                              {session.price && "$"}
                              {session.price}
                            </Text>
                            <Text fontSize={isMobile && 8}>
                              {session.type === "buy file" &&
                              session.frusername === authUsername
                                ? "sell File"
                                : session.type === "sell file" &&
                                  session.frusername !== authUsername
                                ? "buy File"
                                : session.type}
                            </Text>
                            <Button
                              size={isMobile ? "xs" : "sm"}
                              fontSize={isMobile && 10}
                              onClick={() => {
                                window.location.href = `${PROTECTED}/paymu/${session.frusername}/${session.id}`;
                              }}
                            >
                              {session.status === "completed" &&
                                (session.type === "sell file"
                                  ? session.frusername === authUsername
                                    ? "View File"
                                    : "View Session"
                                  : "View Session")}

                              {session.status !== "completed" && session.status}
                            </Button>
                          </HStack>
                        </Box>
                        {/* {session.status === "completed" && (
                          <Button
                            onClick={() => {
                              deleteSession(session.id);
                            }}
                          >
                            X
                          </Button>
                        )} */}
                      </HStack>
                    )
                )
            ) : (
              <Button onClick={handleConnectClick}>New Session</Button>
            )}
          </Box>
        )}
        {/* Render ConnectUserModal */}
        <ConnectUserModal
          isOpen={isConnectModalOpen}
          onClose={handleConnectModalClose}
          onConnect={() => {
            // Handle connection logic
            handleConnectModalClose();
          }}
          authUsername={authUsername}
        />
        {address &&
          sessionId !== 0 &&
          frusername !== 0 &&
          sessionFetched?.frusername && (
            <VStack>
              <Text fontWeight={"bold"} fontSize={"medium"}>
                {sessionFetched?.status ===
                `approve buying file from ${
                  sessionFetched?.frusername === authUsername
                    ? authUsername
                    : sessionFetched?.frusername
                }`
                  ? `waiting ${
                      sessionFetched?.frusername === authUsername
                        ? "for your"
                        : sessionFetched?.frusername + "'s"
                    } file`
                  : sessionFetched?.status ===
                    `approve selling file to ${
                      sessionFetched?.frusername === authUsername
                        ? authUsername
                        : sessionFetched?.frusername
                    }`
                  ? `waiting ${
                      sessionFetched?.frusername !== authUsername
                        ? "for your"
                        : sessionFetched?.frusername + "'s"
                    } file`
                  : sessionFetched?.status === `choose type of exchange` &&
                    sessionFetched?.frusername !== authUsername
                  ? `Select the type of exchange`
                  : sessionFetched?.frusername !== authUsername &&
                    sessionFetched?.status ===
                      `approve file from ${sessionFetched?.authUser}`
                  ? `${frusername} is approving the file`
                  : sessionFetched?.status === "file approved" &&
                    sessionFetched?.frusername !== authUsername
                  ? "insert the amount"
                  : sessionFetched?.status === "withdraw your balance"
                  ? sessionFetched?.buyer === address
                    ? "Download your file"
                    : `${sessionFetched?.status}`
                  : `${sessionFetched?.status}`}
              </Text>
              {sessionFetched?.status ===
                `approve buying file from ${
                  sessionFetched?.frusername === authUsername
                    ? authUsername
                    : sessionFetched?.frusername
                }` ||
                (sessionFetched?.status ===
                  `approve selling file to ${
                    sessionFetched?.frusername === authUsername
                      ? authUsername
                      : sessionFetched?.frusername
                  }` &&
                  sessionFetched?.frusername !== authUsername && (
                    <InputGroup>
                      <InputLeftElement
                        children={
                          <FaFileAudio style={{ pointerEvents: "none" }} />
                        }
                      />
                      <Input
                        type="file"
                        onChange={handleFileChange}
                        placeholder="insert your file here"
                      />
                    </InputGroup>
                  ))}
              {sessionFetched?.status ===
                `approve buying file from ${
                  sessionFetched?.frusername !== authUsername
                    ? authUsername
                    : sessionFetched?.frusername
                }` &&
                sessionFetched?.frusername === authUsername && (
                  <InputGroup>
                    <InputLeftElement
                      children={
                        <FaFileAudio style={{ pointerEvents: "none" }} />
                      }
                    />
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      placeholder="insert your file here"
                    />
                  </InputGroup>
                )}
              {sessionFetched?.fileURL &&
                (sessionFetched ===
                  `approve buying file from ${
                    sessionFetched?.frusername === authUsername
                      ? authUsername
                      : sessionFetched?.frusername
                  }` ||
                  sessionFetched?.status ===
                    `approve selling file to ${
                      sessionFetched?.frusername !== authUsername
                        ? authUsername
                        : sessionFetched?.frusername
                    }`) &&
                sessionFetched?.frusername === authUsername && (
                  <InputGroup>
                    <InputLeftElement
                      children={
                        <FaFileAudio style={{ pointerEvents: "none" }} />
                      }
                    />
                    <Input
                      type="file"
                      onChange={handleFileChange}
                      placeholder="insert your file here"
                    />
                  </InputGroup>
                )}
              {sessionFetched?.status === `file approved` &&
                sessionFetched?.buyer !== address &&
                sessionFetched?.frusername !== authUsername && (
                  <InputGroup>
                    <Input
                      flex="1"
                      maxWidth={"100%"}
                      textAlign={"center"}
                      value={amount}
                      onChange={handleAmountChange}
                      type="text"
                      placeholder="($)100"
                    />
                  </InputGroup>
                )}
              {sessionFetched?.status === `file approved` &&
                sessionFetched?.buyer === address &&
                sessionFetched?.frusername !== authUsername && (
                  <InputGroup>
                    <Input
                      flex="1"
                      maxWidth={"100%"}
                      textAlign={"center"}
                      value={amount}
                      onChange={handleAmountChange}
                      type="text"
                      placeholder="($)100"
                    />
                  </InputGroup>
                )}
              {sessionFetched?.status === "confirm file on blockchain" &&
                sessionFetched?.seller === address && (
                  <>
                    {renderFilePreview(true)}
                    <Button
                      onClick={() => {
                        addFileButton(
                          sessionFetched?.id,
                          sessionFetched?.priceExchanged,
                          sessionFetched?.buyer
                        );
                      }}
                      isLoading={buyFileLoading || usdcLoading}
                    >
                      Confirm File
                    </Button>
                  </>
                )}
              {sessionFetched?.status === "confirm file received" &&
                sessionFetched?.buyer === address && (
                  <>
                    <Text>(next step is downloading the file)</Text>
                    {renderFilePreview(false)}

                    <Button
                      onClick={() => {
                        confirmButtonCall(sessionFetched?.id);
                      }}
                      isLoading={confirmLoading}
                    >
                      Confirm File Received
                    </Button>
                  </>
                )}
              {sessionFetched?.status === "withdraw your balance" &&
                sessionFetched?.seller === address && (
                  <>
                    <Button
                      onClick={() => {
                        withdrawButtonCall();
                      }}
                      isLoading={withdrawLoading}
                    >
                      Withdraw Balance
                    </Button>
                  </>
                )}
              {(sessionFetched?.status === "withdraw your balance" ||
                sessionFetched?.status === "completed") &&
                sessionFetched?.buyer === address && (
                  <>
                    {renderFilePreview(false)}
                    <Link onClick={handleDownloadClick}>
                      <Button>Download file</Button>
                    </Link>
                  </>
                )}

              {sessionFetched?.status === "pay on blockchain" &&
                sessionFetched?.buyer === address && (
                  <>
                    {renderFilePreview(true)}
                    <Button
                      onClick={() => {
                        buyButtonCall(sessionFetched?.id);
                      }}
                      isLoading={buyFileLoading || usdcLoading}
                    >
                      Buy File
                    </Button>
                  </>
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername !== authUsername &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status !==
                  `approve file from ${
                    sessionFetched?.frusername !== authUsername
                      ? frusername
                      : authUsername
                  }` &&
                sessionFetched?.status !==
                  `approve selling file to ${
                    sessionFetched?.frusername !== authUsername
                      ? authUsername
                      : frusername
                  }` &&
                sessionFetched?.status ===
                  `awaiting ${frusername} approval` && (
                  <Spinner
                    mt={5}
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                  />
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername === authUsername &&
                sessionFetched?.status === `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status !==
                  `approve file from ${
                    sessionFetched?.frusername !== authUsername
                      ? frusername
                      : authUsername
                  }` &&
                sessionFetched?.status !==
                  `approve selling file to ${
                    sessionFetched?.frusername !== authUsername
                      ? authUsername
                      : frusername
                  }` && (
                  <Spinner
                    mt={5}
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                  />
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername !== authUsername &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status ===
                  `approve file from ${
                    sessionFetched?.frusername !== authUsername
                      ? authUsername
                      : frusername
                  }` &&
                sessionFetched?.status !==
                  `approve selling file to ${
                    sessionFetched?.frusername !== authUsername
                      ? authUsername
                      : frusername
                  }` && (
                  <Spinner
                    mt={5}
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                  />
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername === authUsername &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status ===
                  `approve file from ${
                    sessionFetched?.frusername !== authUsername
                      ? frusername
                      : authUsername
                  }` &&
                sessionFetched?.status !==
                  `approve selling file to ${
                    sessionFetched?.frusername !== authUsername
                      ? authUsername
                      : frusername
                  }` && (
                  <Spinner
                    mt={5}
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                  />
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername !== authUsername &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status !==
                  `approve file from ${
                    sessionFetched?.frusername !== authUsername
                      ? frusername
                      : authUsername
                  }` &&
                sessionFetched?.status ===
                  `approve selling file to ${
                    sessionFetched?.frusername !== authUsername
                      ? authUsername
                      : frusername
                  }` && (
                  <Spinner
                    mt={5}
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                  />
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername !== authUsername &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status !==
                  `approve file from ${
                    sessionFetched?.frusername !== authUsername
                      ? frusername
                      : authUsername
                  }` &&
                sessionFetched?.status ===
                  `approve buying file from ${
                    sessionFetched?.frusername !== authUsername
                      ? frusername
                      : authUsername
                  }` && (
                  <Spinner
                    mt={5}
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                  />
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status !==
                  `approve file from ${
                    sessionFetched?.frusername !== authUsername
                      ? frusername
                      : authUsername
                  }` &&
                sessionFetched?.status === `confirm file received` &&
                sessionFetched?.seller === address && (
                  <Spinner
                    mt={5}
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                  />
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername === authUsername &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status !==
                  `approve file from ${
                    sessionFetched?.frusername !== authUsername
                      ? frusername
                      : authUsername
                  }` &&
                sessionFetched?.status ===
                  `approve selling file to ${
                    sessionFetched?.frusername !== authUsername
                      ? authUsername
                      : frusername
                  }` && (
                  <Spinner
                    mt={5}
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                  />
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername !== authUsername &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status !==
                  `approve file from ${
                    sessionFetched?.frusername !== authUsername
                      ? frusername
                      : authUsername
                  }` &&
                sessionFetched?.status ===
                  `approve exchange type: ${sessionFetched?.type}` && (
                  <Spinner
                    mt={5}
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                  />
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername !== authUsername &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status !==
                  `approve file from ${
                    sessionFetched?.authUser === authUsername
                      ? frusername
                      : authUsername
                  }` &&
                sessionFetched?.status !==
                  `approve selling file to ${
                    sessionFetched?.frusername !== authUsername
                      ? authUsername
                      : frusername
                  }` &&
                sessionFetched?.status !== "file approved" &&
                sessionFetched?.status === "approve amount" &&
                sessionFetched?.seller === address &&
                sessionFetched?.type === "sell file" && (
                  <Spinner
                    mt={5}
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                  />
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername !== authUsername &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status !==
                  `approve file from ${
                    sessionFetched?.authUser === authUsername
                      ? frusername
                      : authUsername
                  }` &&
                sessionFetched?.status !==
                  `approve selling file to ${
                    sessionFetched?.frusername !== authUsername
                      ? authUsername
                      : frusername
                  }` &&
                sessionFetched?.status !== "file approved" &&
                sessionFetched?.status === "approve amount" &&
                sessionFetched?.buyer === address &&
                sessionFetched?.type === "buy file" && (
                  <Spinner
                    mt={5}
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                  />
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status !==
                  `approve file from ${
                    sessionFetched?.authUser === authUsername
                      ? frusername
                      : authUsername
                  }` &&
                sessionFetched?.status !==
                  `approve selling file to ${
                    sessionFetched?.frusername !== authUsername
                      ? authUsername
                      : frusername
                  }` &&
                sessionFetched?.status !== "file approved" &&
                sessionFetched?.status !== "approve amount" &&
                sessionFetched?.status === "confirm file on blockchain" &&
                sessionFetched?.buyer === address && (
                  <Spinner
                    mt={5}
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                  />
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status !==
                  `approve file from ${
                    sessionFetched?.authUser === authUsername
                      ? frusername
                      : authUsername
                  }` &&
                sessionFetched?.status !==
                  `approve selling file to ${
                    sessionFetched?.frusername !== authUsername
                      ? authUsername
                      : frusername
                  }` &&
                sessionFetched?.status !== "file approved" &&
                sessionFetched?.status !== "approve amount" &&
                sessionFetched?.status !== "confirm file on blockchain" &&
                sessionFetched?.status === "pay on blockchain" &&
                sessionFetched?.seller === address && (
                  <Spinner
                    mt={5}
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                  />
                )}
              {(!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername === authUsername &&
                sessionFetched?.status === `choose type of exchange`) ||
                sessionFetched?.status ===
                  `approve selling file to ${
                    sessionFetched?.frusername === authUsername
                      ? frusername
                      : authUsername
                  }` ||
                (sessionFetched?.status === "file approved" &&
                  sessionFetched?.buyer === address &&
                  sessionFetched?.type === "sell file" && (
                    <Spinner
                      mt={5}
                      thickness="4px"
                      speed="0.65s"
                      emptyColor="gray.200"
                      color="blue.500"
                      size="xl"
                    />
                  ))}
              {sessionFetched?.status === "file approved" &&
                sessionFetched?.frusername === authUsername &&
                sessionFetched?.type === "buy file" && (
                  <Spinner
                    mt={5}
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                  />
                )}
              {sessionFetched?.frusername !== authUsername &&
                sessionFetched?.status === `choose type of exchange` && (
                  <Select
                    placeholder="Choose type of exchange"
                    onChange={(e) => {
                      setSessionType(e.target.value);
                    }}
                  >
                    <option value="buy file">
                      Buy File from{" "}
                      {sessionFetched?.frusername === authUsername
                        ? authUsername
                        : sessionFetched?.frusername}
                    </option>
                    <option value="sell file">
                      Sell File to{" "}
                      {sessionFetched?.frusername === authUsername
                        ? authUsername
                        : sessionFetched?.frusername}
                    </option>
                  </Select>
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername === authUsername &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                selectedFile !== undefined &&
                sessionFetched?.status ===
                  `approve file from ${authUsername}` &&
                !selectedFile && (
                  <VStack>
                    <Text>
                      {sessionFetched?.status ===
                      `awaiting ${authUsername} approval`
                        ? "Do you want to approve the connection with the user?"
                        : "Do You want to approve the exchange ?"}
                    </Text>
                    <HStack>
                      <Button
                        onClick={() => {
                          handleApprove(
                            sessionFetched?.id,
                            sessionFetched?.authUser,
                            sessionType || sessionFetched?.type
                          );
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          handleDeny(
                            sessionFetched?.id,
                            sessionFetched?.authUser
                          );
                        }}
                      >
                        Cancel Session
                      </Button>
                    </HStack>
                  </VStack>
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername === authUsername &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status ===
                  `awaiting ${authUsername} approval` && (
                  <VStack>
                    <Text>
                      {sessionFetched?.status ===
                      `awaiting ${authUsername} approval`
                        ? "Do you want to approve the connection with the user?"
                        : "Do You want to approve the exchange ?"}
                    </Text>
                    <HStack>
                      <Button
                        onClick={() => {
                          handleApprove(
                            sessionFetched?.id,
                            sessionFetched?.authUser,
                            sessionType || sessionFetched?.type
                          );
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          handleDeny(
                            sessionFetched?.id,
                            sessionFetched?.authUser
                          );
                        }}
                      >
                        Cancel Session
                      </Button>
                    </HStack>
                  </VStack>
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername === authUsername &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status ===
                  `approve exchange type: ${sessionFetched?.type}` && (
                  <VStack>
                    <Text>
                      {sessionFetched?.status ===
                      `awaiting ${authUsername} approval`
                        ? "Do you want to approve the connection with the user?"
                        : "Do You want to approve the exchange ?"}
                    </Text>
                    <HStack>
                      <Button
                        onClick={() => {
                          handleApprove(
                            sessionFetched?.id,
                            sessionFetched?.authUser,
                            sessionType || sessionFetched?.type
                          );
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          handleDeny(
                            sessionFetched?.id,
                            sessionFetched?.authUser
                          );
                        }}
                      >
                        Cancel Session
                      </Button>
                    </HStack>
                  </VStack>
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername !== authUsername &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                amount !== "" &&
                sessionFetched?.status === `file approved` && (
                  <VStack>
                    <Text>
                      {sessionFetched?.status ===
                      `awaiting ${authUsername} approval`
                        ? "Do you want to approve the connection with the user?"
                        : `Do You want to approve the amount of $${amount} ?`}
                    </Text>
                    <HStack>
                      <Button
                        onClick={() => {
                          handleApprove(
                            sessionFetched?.id,
                            sessionFetched?.authUser,
                            sessionType || sessionFetched?.type,
                            fileUrl,
                            sessionFetched?.buyer,
                            amount,
                            address
                          );
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          handleDeny(
                            sessionFetched?.id,
                            sessionFetched?.authUser
                          );
                        }}
                      >
                        Cancel Session
                      </Button>
                    </HStack>
                  </VStack>
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                selectedFile &&
                sessionFetched?.status !==
                  `approve file from ${
                    sessionFetched?.frusername === authUsername
                      ? sessionFetched?.frusername
                      : sessionFetched?.authUser
                  }` &&
                sessionFetched?.status !== "file approved" &&
                sessionFetched?.status !== "approve amount" &&
                sessionFetched?.status !== "confirm file on blockchain" &&
                sessionFetched?.status !== "pay on blockchain" &&
                sessionFetched?.status !== "confirm file received" &&
                sessionFetched?.status !== "withdraw your balance" && (
                  <VStack>
                    <Text>
                      {sessionFetched?.status ===
                      `awaiting ${authUsername} approval`
                        ? "Do you want to approve the connection with the user?"
                        : "Do You want to approve the file sending ?"}
                    </Text>
                    <HStack>
                      <Button
                        onClick={() => {
                          handleApprove(
                            sessionFetched?.id,
                            sessionFetched?.authUser,
                            sessionType || sessionFetched?.type,
                            fileLink
                          );
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          handleDeny(
                            sessionFetched?.id,
                            sessionFetched?.authUser
                          );
                        }}
                      >
                        Cancel Session
                      </Button>
                    </HStack>
                  </VStack>
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status !==
                  `approve file from ${
                    sessionFetched?.frusername === authUsername
                      ? sessionFetched?.frusername
                      : sessionFetched?.authUser
                  }` &&
                sessionFetched?.status === "approve amount" &&
                sessionFetched?.buyer === address &&
                sessionFetched?.type === "sell file" && (
                  <VStack>
                    <Text>
                      {sessionFetched?.status ===
                      `awaiting ${authUsername} approval`
                        ? "Do you want to approve the connection with the user?"
                        : `Do You want to approve the amount for the file of $${sessionFetched?.priceExchanged}?`}
                    </Text>
                    <HStack>
                      <Button
                        onClick={() => {
                          handleApprove(
                            sessionFetched?.id,
                            sessionFetched?.authUser,
                            sessionType || sessionFetched?.type,
                            fileUrl,
                            sessionFetched?.buyer,
                            sessionFetched?.priceExchanged,
                            sessionFetched?.seller,
                            true
                          );
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          handleDeny(
                            sessionFetched?.id,
                            sessionFetched?.authUser
                          );
                        }}
                      >
                        Cancel Session
                      </Button>
                    </HStack>
                  </VStack>
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status !== `approve file` &&
                sessionFetched?.status !==
                  `approve file from ${
                    sessionFetched?.frusername === authUsername
                      ? sessionFetched?.frusername
                      : sessionFetched?.authUser
                  }` &&
                sessionFetched?.status === "approve amount" &&
                sessionFetched?.buyer !== address &&
                sessionFetched?.type === "buy file" && (
                  <VStack>
                    <Text>
                      {sessionFetched?.status ===
                      `awaiting ${authUsername} approval`
                        ? "Do you want to approve the connection with the user?"
                        : `Do You want to approve the amount for the file of $${sessionFetched?.priceExchanged}?`}
                    </Text>
                    <HStack>
                      <Button
                        onClick={() => {
                          handleApprove(
                            sessionFetched?.id,
                            sessionFetched?.authUser,
                            sessionType || sessionFetched?.type,
                            fileUrl,
                            sessionFetched?.buyer === address &&
                              sessionFetched?.type === "buy file"
                              ? address
                              : sessionFetched?.seller,
                            sessionFetched?.priceExchanged,
                            sessionFetched?.buyer !== address &&
                              sessionFetched?.type === "buy file"
                              ? address
                              : sessionFetched?.buyer,

                            true
                          );
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          handleDeny(
                            sessionFetched?.id,
                            sessionFetched?.authUser
                          );
                        }}
                      >
                        Cancel Session
                      </Button>
                    </HStack>
                  </VStack>
                )}
              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername !== authUsername &&
                sessionFetched?.status === `choose type of exchange` &&
                sessionType &&
                !selectedFile &&
                sessionFetched?.status !== `approve file` && (
                  <VStack>
                    <Text>
                      {sessionFetched?.status ===
                      `awaiting ${authUsername} approval`
                        ? "Do you want to approve the connection with the user?"
                        : sessionType
                        ? `Do you want to approve the type: ${sessionType}`
                        : "Do You want to approve the exchange ?"}
                    </Text>
                    <HStack>
                      <Button
                        onClick={() => {
                          handleApprove(
                            sessionFetched?.id,
                            sessionFetched?.authUser,
                            sessionType
                          );
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          handleDeny(
                            sessionFetched?.id,
                            sessionFetched?.authUser
                          );
                        }}
                      >
                        Cancel Session
                      </Button>
                    </HStack>
                  </VStack>
                )}

              {!sessionFetched?.confirmedExchange &&
                sessionFetched?.frusername !== authUsername &&
                sessionFetched?.status !== `choose type of exchange` &&
                sessionFetched?.status ===
                  `approve selling file to ${authUsername}` && (
                  <Text mt={5}>Awaiting user confirmation</Text>
                )}
            </VStack>
          )}

        {address &&
          !sessionFetched?.confirmedExchange &&
          sessionFetched?.status !== "choose type of exchange" &&
          sessionFetched?.status !== "approve file" &&
          ((sessionFetched?.status ===
            `approve file from ${sessionFetched?.authUser}` &&
            sessionFetched?.type === "sell file" &&
            authUsername === frusername) ||
            (sessionFetched?.status === `approve file from ${frusername}` &&
              sessionFetched?.type === "buy file" &&
              authUsername !== frusername)) && (
            <VStack>
              {renderFilePreview(true)}
              <Text>
                {sessionFetched?.status === `awaiting ${authUsername} approval`
                  ? "Do you want to approve the connection with the user?"
                  : "Do You want to approve the exchange ?"}
              </Text>
              <HStack>
                <Button
                  onClick={() => {
                    handleApprove(
                      sessionFetched?.id,
                      sessionFetched?.authUser,
                      sessionType || sessionFetched?.type,
                      fileUrl,
                      address
                    );
                  }}
                >
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    handleDeny(sessionFetched?.id, sessionFetched?.authUser);
                  }}
                >
                  Cancel Session
                </Button>
              </HStack>
            </VStack>
          )}

        {/*<VStack spacing={1} align="center">*/}
        {/* <Flex justifyContent="center" width="100%">
          <HStack spacing={isMobile ? 0 : "200px"} mt={20} align="center">
            <Box>
              <InputGroup>
                <InputLeftElement>
                  <Avatar src={user?.avatar || ""} size="sm" />
                </InputLeftElement>
                <Input
                  flex="1"
                  maxWidth={inputWidth}
                  placeholder={"@" + (user?.username || "alelentini")}
                />
                <Checkbox colorScheme="green" disabled defaultChecked ml={2} />
              </InputGroup>
              
              <Stack direction={"column"} align={"center"}>
                <Stack direction={"row"} mt={10} mb={3}>
                  <Text>File</Text>
                  <Switch size="lg" onChange={handleSwitchChange} />
                  <Text>Pay</Text>
                  <Checkbox colorScheme="green" disabled defaultChecked />
                  <Checkbox
                    colorScheme="green"
                    disabled
                    defaultChecked
                    ml={2}
                  />
                </Stack>
                {!showAdditionalInputGroup ? (
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      children={<FaFileAudio />}
                    />
                    <input
                      style={{ display: "none" }}
                      type="file"
                      onChange={handleFileChange}
                    />
                    <Text
                      ml={8}
                      style={{
                        border: "1px solid #ccc",
                        padding: "5px 10px",
                        flex: 1,
                        marginRight: "4px",
                      }}
                    >
                      {selectedFile ? selectedFile.name : "Musicom Bit"}
                    </Text>
                    <Checkbox colorScheme="green" disabled defaultChecked />
                    <Checkbox
                      colorScheme="green"
                      disabled
                      defaultChecked
                      ml={2}
                    />
                  </InputGroup>
                ) : (
                  <InputGroup>
                    <Input
                      flex="1"
                      maxWidth={inputWidth}
                      type="text"
                      placeholder="(£)250.00"
                      mb={!showAdditionalInputGroup2 ? "3" : ""}
                    />
                    <Checkbox
                      colorScheme="green"
                      disabled
                      defaultChecked
                      ml={2}
                    />
                    <Checkbox
                      colorScheme="green"
                      disabled
                      defaultChecked
                      ml={2}
                    />
                  </InputGroup>
                )}
              </Stack>
              {!showAdditionalInputGroup ? (
                <Button ml={8}>Play Trailer</Button>
              ) : (
                <Box h={19} />
              )}
              <Text mt={8}>Recieved</Text>
              {!showAdditionalInputGroup2 ? (
                <InputGroup>
                  <InputLeftElement
                    pointerEvents="none"
                    children={<FaFileAudio />}
                  />
                  <input
                    style={{ display: "none" }}
                    type="file"
                    onChange={handleFileChange}
                  />
                  <Text
                    ml={8}
                    style={{
                      border: "1px solid #ccc",
                      padding: "5px 10px",
                      flex: 1,
                      marginRight: "4px",
                    }}
                  >
                    {selectedFile ? selectedFile.name : "Musicom Bit"}
                  </Text>
                  <Button color="#1041B2">Save/Download</Button>
                </InputGroup>
              ) : (
                <InputGroup>
                  <Input
                    flex="1"
                    maxWidth={inputWidth}
                    type="text"
                    placeholder="(£)237.50"
                  />
                </InputGroup>
              )}
            </Box>
            <Box>
              <InputGroup>
                <InputLeftElement>
                  <Avatar src={user?.avatar || ""} size="sm" />
                </InputLeftElement>
                <Input
                  flex="1"
                  maxWidth={inputWidth}
                  placeholder={"@musicom"}
                />
                <Checkbox colorScheme="green" disabled defaultChecked ml={2} />
              </InputGroup>
              
              <Stack direction={"column"} align={"center"}>
                <Stack direction={"row"} mt={10} mb={3}>
                  <Text>File</Text>
                  <Switch size="lg" onChange={handleSwitchChange2} />
                  <Text>Pay</Text>
                  <Checkbox colorScheme="green" disabled defaultChecked />
                  <Checkbox
                    colorScheme="green"
                    disabled
                    defaultChecked
                    ml={2}
                  />
                </Stack>
                {!showAdditionalInputGroup2 ? (
                  <InputGroup>
                    <InputLeftElement
                      pointerEvents="none"
                      children={<FaFileAudio />}
                    />
                    <input
                      style={{ display: "none" }}
                      type="file"
                      onChange={handleFileChange}
                    />
                    <Text
                      ml={8}
                      style={{
                        border: "1px solid #ccc",
                        padding: "5px 10px",
                        flex: 1,
                        marginRight: "4px",
                      }}
                    >
                      {selectedFile ? selectedFile.name : "Musicom Bit"}
                    </Text>
                    <Checkbox colorScheme="green" disabled defaultChecked />
                    <Checkbox
                      colorScheme="green"
                      disabled
                      defaultChecked
                      ml={2}
                    />
                  </InputGroup>
                ) : (
                  <InputGroup>
                    <Input
                      flex="1"
                      maxWidth={inputWidth}
                      type="text"
                      placeholder="(£)250.00"
                      mb={!showAdditionalInputGroup ? "3" : ""}
                    />
                    <Checkbox
                      colorScheme="green"
                      disabled
                      defaultChecked
                      ml={2}
                    />
                    <Checkbox
                      colorScheme="green"
                      disabled
                      defaultChecked
                      ml={2}
                    />
                  </InputGroup>
                )}
              </Stack>
              {!showAdditionalInputGroup2 ? (
                <Button ml={8}>Play Trailer</Button>
              ) : (
                <Box h={19} />
              )}
              <Text mt={8}>Recieved</Text>
              {!showAdditionalInputGroup ? (
                <InputGroup>
                  <InputLeftElement
                    pointerEvents="none"
                    children={<FaFileAudio />}
                  />
                  <input
                    style={{ display: "none" }}
                    type="file"
                    onChange={handleFileChange}
                  />
                  <Text
                    ml={8}
                    style={{
                      border: "1px solid #ccc",
                      padding: "5px 10px",
                      flex: 1,
                      marginRight: "4px",
                    }}
                  >
                    {selectedFile ? selectedFile.name : "Musicom Bit"}
                  </Text>
                  <Button color="#1041B2">Save/Download</Button>
                </InputGroup>
              ) : (
                <InputGroup>
                  <Input
                    flex="1"
                    maxWidth={inputWidth}
                    type="text"
                    placeholder="(£)237.50"
                  />
                </InputGroup>
              )}
            </Box>
          </HStack>
        </Flex>
        <Box mt={10} align="center">
          <Button mt={8} variant="outline">
            Dispute
          </Button>
          <Text>or</Text>
          <Button variant="outline">Close</Button>
        </Box> */}
        {!address && (
          <ConnectWallet
            theme={colorMode}
            btnTitle={"Connect to PayMu"}
            welcomeScreen={{
              img: {
                src: logoM,
                width: 150,
                height: 150,
              },
            }}
            displayBalanceToken={{
              [Goerli.chainId]: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F", //USDC
            }}
            termsOfServiceUrl={`${PROTECTED}/termsandconditions`}
            privacyPolicyUrl={`${PROTECTED}/privatypolicy`}
          />
        )}
        {/*
          {!balanceLoading && (
            <Text>
              {data.name} - {data.displayValue} - {data.decimals} -{" "}
              {data.value.toString()} -{" "}
              {data.value.toString() === utils.parseUnits("200", 6).toString()
                ? "true"
                : "false"}
            </Text>
          )}
          {address && !isLoadinggg && (
            <>
              <Button
                onClick={() => {
                  addFileButton(
                    "10",
                    "0xb7c81e08952F2790D1052E3E1f9cCC0d8f83C9d9"
                  );
                }}
                isLoading={isLoading}
              >
                addFile
              </Button>
              <Button
                onClick={() => {
                  buyButtonCall("3");
                }}
                isLoading={buyFileLoading || usdcLoading}
              >
                buyFile
              </Button>
              <Button
                onClick={() => {
                  confirmButtonCall("3");
                }}
                isLoading={confirmLoading}
              >
                condirm
              </Button>
              
              <Button
                onClick={() => {
                  withdrawButtonCall();
                }}
                isLoading={withdrawLoading}
              >
                Withdraw
              </Button>
              
            </>
          )}
        </VStack> */}
      </VStack>
    </Center>
  );
};

export default PayMu;
