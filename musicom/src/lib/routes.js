import Login from 'components/auth/Login';
import Register from 'components/auth/Register';
import Reset from 'components/auth/Reset';
import Verification from 'components/auth/Verification';
import Layout from 'components/layout';
import Dashboard from 'components/dashboard';
import { createBrowserRouter } from 'react-router-dom';
import Comments from 'components/comments';
import Profile from 'components/profile';
import NotFound from 'utils/404Error';
import SearchPage from 'components/navbar/Search';
import NetworkPage from 'components/network/networkPage';
import Findr from 'components/findr/findr';
import MessageMu from 'components/messageMu/messageMu';
import PayMu from 'components/payMu';
import ForumPage from 'components/forum';
import Forums from 'components/forum/forums';
import ForumPosts from 'components/forum/forumPosts';
import Billing from 'components/billing/billing';
import AdminPanel from 'components/admin';
import Settings from 'components/settings';
import InStudio from 'components/instudio';

export const ROOT = '/';
export const LOGIN = '/login';
export const REGISTER = '/register';
export const VERIFICATION = '/verification';
export const RESET = '/resetPassword';

export const PROTECTED = '/protected';
export const DASHBOARD = '/protected/dashboard';
export const USER = '/protected/profile/:username';
export const COMMENTS = '/protected/comments/:id';
export const SEARCH = '/protected/search';
export const NETWORK = '/protected/network';
export const FINDR = '/protected/findr';
export const MESSAGEMU = '/protected/messages';
export const MESSAGEMUSER = '/protected/messages/:id';
export const PAYMU = '/protected/paymu';
export const PAYMUSESSION = '/protected/paymu/:username/:id';
export const FORUM = '/protected/forum';
export const FORUMS = '/protected/forums/:title/:id';
export const FORUMPOSTS = '/protected/forum/forumPosts/:forumId/:postId';
export const BILLING = '/protected/billing';
export const ADMIN = '/protected/admin';
export const SETTINGS = '/protected/settings';
export const INSTUDIO = '/protected/instudio';

export const router = createBrowserRouter([
  { path: ROOT, element: <Login /> },
  { path: LOGIN, element: <Login /> },
  { path: REGISTER, element: <Register /> },
  { path: VERIFICATION, element: <Verification /> },
  { path: RESET, element: <Reset /> },
  { path: '*', element: <NotFound /> },
  {
    path: PROTECTED,
    element: <Layout />,
    children: [
      { path: DASHBOARD, element: <Dashboard /> },
      { path: USER, element: <Profile /> },
      { path: COMMENTS, element: <Comments /> },
      { path: SEARCH, element: <SearchPage /> },
      { path: NETWORK, element: <NetworkPage /> },
      { path: FINDR, element: <Findr /> },
      { path: MESSAGEMU, element: <MessageMu /> },
      { path: MESSAGEMUSER, element: <MessageMu /> },
      { path: PAYMU, element: <PayMu /> },
      { path: PAYMUSESSION, element: <PayMu /> },
      { path: FORUM, element: <ForumPage /> },
      { path: FORUMS, element: <Forums /> },
      { path: FORUMPOSTS, element: <ForumPosts /> },
      { path: BILLING, element: <Billing /> },
      { path: ADMIN, element: <AdminPanel /> },
      { path: SETTINGS, element: <Settings /> },
      { path: INSTUDIO, element: <InStudio /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
