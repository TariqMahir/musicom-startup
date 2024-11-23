import { BiUser } from "react-icons/bi";
import {
  BsChatDots,
  BsFillChatSquareDotsFill,
  BsGearFill,
  BsPatchQuestion,
  BsTelephone,
} from "react-icons/bs";
import { FaSignOutAlt } from "react-icons/fa";
import { FiUsers } from "react-icons/fi";
import { FiArchive } from "react-icons/fi";
import { TbHomeQuestion, TbMessage2Question } from "react-icons/tb";

const Profile_Menu = [
  { index: 0, icon: <BiUser /> },
  { index: 1, icon: <BsGearFill /> },
  { index: 2, icon: <FaSignOutAlt /> },
];

const Nav_Buttons = [
  { index: 0, label: "Messages" },
  { index: 1, label: "Groups" },
  { index: 2, label: "Requests" }
];

const MembersList = [
  {
    id: 0,
    img: "https://firebasestorage.googleapis.com/v0/b/musicom-d43cd.appspot.com/o/avatars%2FfCbIFRzNCzV0cNgP049Xn3jnwkn2?alt=media&token=5b84db01-40d0-453e-9d9f-31cf89cc59f3",
    name: "Alessandro Lentini",
    online: true,
  },
  {
    id: 1,
    img: "",
    name: "Tariq Mahir",
    online: false,
  },
  {
    id: 2,
    img: "",
    name: "Christian CEO",
    online: true,
  },
  {
    id: 3,
    img: "",
    name: "Boladale",
    online: false,
  },
];
const CallLogs = [
  {
    id: 0,
    img: "https://firebasestorage.googleapis.com/v0/b/musicom-d43cd.appspot.com/o/avatars%2FfCbIFRzNCzV0cNgP049Xn3jnwkn2?alt=media&token=5b84db01-40d0-453e-9d9f-31cf89cc59f3",
    name: "Alessandro Lentini",
    missed: false,
    incoming: true,
  },
  {
    id: 1,
    img: "",
    name: "Tariq Mahir",
    missed: true,
    incoming: false,
  },
  {
    id: 2,
    img: "",
    name: "Christian CEO",
    missed: false,
    incoming: true,
  },
  {
    id: 3,
    img: "https://firebasestorage.googleapis.com/v0/b/musicom-d43cd.appspot.com/o/avatars%2FfCbIFRzNCzV0cNgP049Xn3jnwkn2?alt=media&token=5b84db01-40d0-453e-9d9f-31cf89cc59f3",
    name: "Alessandro Lentini",
    missed: false,
    incoming: false,
  },
  {
    id: 4,
    img: "",
    name: "Christian CEO",
    missed: true,
    incoming: true,
  },
];

const ChatList = [
  {
    id: 0,
    img: "https://firebasestorage.googleapis.com/v0/b/musicom-d43cd.appspot.com/o/avatars%2FfCbIFRzNCzV0cNgP049Xn3jnwkn2?alt=media&token=5b84db01-40d0-453e-9d9f-31cf89cc59f3",
    name: "Alessandro Lentini",
    msg: "Ciao",
    time: "9:36",
    unread: 0,
    pinned: true,
    online: true,
  },
  {
    id: 1,
    img: "",
    name: "Tariq Mahir",
    msg: "Hello",
    time: "12:02",
    unread: 2,
    pinned: true,
    online: false,
  },
  {
    id: 2,
    img: "",
    name: "Christian CEO",
    msg: "Hello",
    time: "10:50",
    unread: 2,
    pinned: false,
    online: false,
  },
  {
    id: 3,
    img: "",
    name: "Christian CEO",
    msg: "Hello",
    time: "10:50",
    unread: 3,
    pinned: false,
    online: false,
  },
  {
    id: 4,
    img: "",
    name: "Christian CEO",
    msg: "Hello",
    time: "10:50",
    unread: 1,
    pinned: false,
    online: true,
  },
  {
    id: 5,
    img: "",
    name: "Christian CEO",
    msg: "Hello",
    time: "10:50",
    unread: 0,
    pinned: true,
    online: false,
  },
  {
    id: 6,
    img: "",
    name: "Christian CEO",
    msg: "Hello",
    time: "10:50",
    unread: 1,
    pinned: false,
    online: false,
  },
  {
    id: 7,
    img: "",
    name: "Christian CEO",
    msg: "Hello",
    time: "10:50",
    unread: 0,
    pinned: false,
    online: false,
  },
  {
    id: 8,
    img: "",
    name: "Christian CEO",
    msg: "Hello",
    time: "10:50",
    unread: 5,
    pinned: false,
    online: false,
  },
  {
    id: 9,
    img: "",
    name: "Christian CEO",
    msg: "Hello",
    time: "10:50",
    unread: 2,
    pinned: false,
    online: false,
  },
];

const ChatHistory = [
  {
    type: "msg",
    message: "Hi 👋 how are you?",
    incoming: true,
    outgoing: false,
  },
  { type: "divider", text: "Today" },
  { type: "msg", message: "Hi Not bad u?", incoming: false, outgoing: true },
  {
    type: "msg",
    message: "Can u send me an abstract image?",
    incoming: false,
    outgoing: true,
  },
  {
    type: "msg",
    subtype: "reply",
    message: "Yes Sure",
    reply: "Can u send me an abstract image?",
    incoming: true,
    outgoing: false,
  },
  {
    type: "msg",
    subtype: "link",
    preview:
      "https://firebasestorage.googleapis.com/v0/b/musicom-d43cd.appspot.com/o/avatars%2FfCbIFRzNCzV0cNgP049Xn3jnwkn2?alt=media&token=5b84db01-40d0-453e-9d9f-31cf89cc59f3",
    message: "Yes Sure",
    incoming: true,
    outgoing: false,
  },
  {
    type: "msg",
    subtype: "img",
    message: "Here you go",
    img: "https://firebasestorage.googleapis.com/v0/b/musicom-d43cd.appspot.com/o/avatars%2FfCbIFRzNCzV0cNgP049Xn3jnwkn2?alt=media&token=5b84db01-40d0-453e-9d9f-31cf89cc59f3",
    incoming: true,
    outgoing: false,
  },
  {
    type: "msg",
    message: "Can u send me the file please?",
    incoming: false,
    outgoing: true,
  },
  {
    type: "msg",
    subtype: "doc",
    preview:
      "https://firebasestorage.googleapis.com/v0/b/musicom-d43cd.appspot.com/o/avatars%2FfCbIFRzNCzV0cNgP049Xn3jnwkn2?alt=media&token=5b84db01-40d0-453e-9d9f-31cf89cc59f3",
    message: "Yes Sure",
    incoming: true,
    outgoing: false,
  },
  {
    type: "msg",
    subtype: "doc",
    message: "Try this",
    incoming: false,
    outgoing: true,
  },
];

const SHARED_LINKS = [
  {
    type: "msg",
    subtype: "link",
    preview:
      "https://firebasestorage.googleapis.com/v0/b/musicom-d43cd.appspot.com/o/avatars%2FfCbIFRzNCzV0cNgP049Xn3jnwkn2?alt=media&token=5b84db01-40d0-453e-9d9f-31cf89cc59f3",
    message: "Yes Sure",
    incoming: true,
    outgoing: false,
  },
  {
    type: "msg",
    subtype: "link",
    preview:
      "https://firebasestorage.googleapis.com/v0/b/musicom-d43cd.appspot.com/o/avatars%2FfCbIFRzNCzV0cNgP049Xn3jnwkn2?alt=media&token=5b84db01-40d0-453e-9d9f-31cf89cc59f3",
    message: "Yes Sure",
    incoming: true,
    outgoing: false,
  },
  {
    type: "msg",
    subtype: "link",
    preview:
      "https://firebasestorage.googleapis.com/v0/b/musicom-d43cd.appspot.com/o/avatars%2FfCbIFRzNCzV0cNgP049Xn3jnwkn2?alt=media&token=5b84db01-40d0-453e-9d9f-31cf89cc59f3",
    message: "Yes Sure",
    incoming: true,
    outgoing: false,
  },
];

const SHARED_DOCS = [
  {
    type: "msg",
    subtype: "doc",
    preview:
      "https://firebasestorage.googleapis.com/v0/b/musicom-d43cd.appspot.com/o/avatars%2FfCbIFRzNCzV0cNgP049Xn3jnwkn2?alt=media&token=5b84db01-40d0-453e-9d9f-31cf89cc59f3",
    message: "Yes Sure",
    incoming: true,
    outgoing: false,
  },
  {
    type: "msg",
    subtype: "doc",
    message: "Try this",
    incoming: true,
    outgoing: false,
  },
];

const Message_Options = [
  { title: "Reply" },
  { title: "React to message" },
  { title: "Foward message" },
  { title: "Star message" },
  { title: "Report" },
  { title: "Delete message" },
];

export {
  Profile_Menu,
  Nav_Buttons,
  CallLogs,
  ChatList,
  ChatHistory,
  Message_Options,
  SHARED_LINKS,
  SHARED_DOCS,
  MembersList,
};
