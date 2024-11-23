import React, { useState, useEffect } from 'react';
import { db } from 'lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { useAuth } from 'hooks/auth';
import {
  Box,
  Input,
  Button,
  VStack,
  HStack,
  Text,
} from '@chakra-ui/react';
import { format } from 'date-fns'; 

const formattedDate = format(date, 'PPpp');



const GroupChats = ({ activeGroupId }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const { user } = useAuth();

  // Fetch messages for the active group
  useEffect(() => {
    if (!activeGroupId) return;
    
    const messagesRef = collection(db, 'groups', activeGroupId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [activeGroupId]);

  // Send a message
  const sendMessage = async () => {
    if (!message.trim()) return;
    const messagesRef = collection(db, 'groups', activeGroupId, 'messages');
    
    await addDoc(messagesRef, {
      text: message,
      sentBy: user.uid,
      createdAt: new Date(),
    });

    setMessage('');
  };

  // Function to handle file selection and upload
const handleFileUpload = async (file) => {
  // Upload file to Firebase Storage and get the URL
  const storageRef = firebase.storage().ref(`media/${file.name}`);
  const snapshot = await storageRef.put(file);
  const mediaUrl = await snapshot.ref.getDownloadURL();

  // Send a message with this URL to Firestore
  const message = {
    sentBy: userId,
    mediaUrl: mediaUrl,
    type: 'media', // or more specific type based on the file
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    // other metadata
  };
  await firebase.firestore().collection('groups').doc(groupId).collection('messages').add(message);
};

// JSX for file input inside your render method or component return
<input type="file" onChange={(e) => handleFileUpload(e.target.files[0])} />


const formattedDate = format(date, 'PPpp');

const date = el.createdAt.toDate();


  // Render messages
  const renderMessages = messages.map(msg => (
    <Box key={msg.id} bg={msg.sentBy === user.uid ? 'blue.100' : 'gray.100'} p={2} rounded="md">
      {msg.text}
    </Box>
  ));

  return (
    <VStack spacing={4}>
      <VStack spacing={2} w="full" h="400px" overflowY="scroll">
        {renderMessages}
      </VStack>
      <HStack w="full">
        <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." />
        <Button onClick={sendMessage}>Send</Button>
      </HStack>
    </VStack>
  );
};

// add people to group chat
const addMemberToGroup = async () => {
  const groupRef = doc(db, 'groups', activeGroupId);
  try {
    await updateDoc(groupRef, {
      members: arrayUnion(newMemberId)
    });
    console.log('Member added successfully');
    setNewMemberId(''); // Reset input after addition
  } catch (error) {
    console.error('Error adding member: ', error);
  }
};

const renderMessages = messages.map(msg => (
  <Box key={msg.id} bg={msg.sentBy === user.uid ? 'blue.100' : 'gray.100'} p={2} rounded="md">
    <Text>{msg.text}</Text>
    <Text fontSize="xs" color="gray.500">{format(msg.createdAt.toDate(), 'PPpp')}</Text>
  </Box>
));

// Existing message rendering and other logic...

return (
  <VStack spacing={4}>
    { }
    <HStack>
      <Input
        value={newMemberId}
        onChange={(e) => setNewMemberId(e.target.value)}
        placeholder="Enter new member ID"
      />
      <Button colorScheme="blue" onClick={addMemberToGroup}>Add Member to chat</Button>
    </HStack>
    { }
  </VStack>
);


export default GroupChats;
