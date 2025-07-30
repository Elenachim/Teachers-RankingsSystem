import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";

import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import MailVerification from "./pages/MailVerification";

import AuthRoot from "./contexts/AuthRoot";

//import ScheduleDashboard from "./pages/dashboard/ScheduleDashboard";

import AdminSideBar from "./components/AdminSideBar";
import ChangePassword from "./pages/Passwords/ChangePassword";
//import UserProfile from './pages/UserProfile';
import PasswordReset from "./pages/Passwords/ResetPasswordSendToken";
import ChangePasswordAfterReset from "./pages/Passwords/ChangePasswordAfterReset";
import UsersDashboard from "./pages/UsersDashboard/UsersDashboard";
import AddCategoryPage from "./pages/ManageLists/addnewcategory";
import Categories from "./pages/ManageLists/Categories";
import Profile from "./pages/profile/Userprofile";
import RankingList from "./pages/RankingLists";
import MyTrackingDashboard from "./pages/MyTrackingDashboard";
import TrackingForm from "./pages/StartTrackingForm";
import RankingHistory from "./pages/RankingHistory";

import AddFile from "./pages/ManageLists/AddFile";
import TrackOthers from "./pages/TrackOthers";
import RankingStatistics from "./pages/RankingStatistics";
import CustomEmail from "./pages/CustomEmail";
import ApiInterface from "./pages/ApiInterface";
import ApiManagement from "./pages/ApiManagement";

import HelpCenter from "./pages/HelpCenter";

function App() {
  return (
    <Router>
      <HelpCenter />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/track-myself" element={<MyTrackingDashboard />} />
        <Route path="/start-tracking" element={<TrackingForm />} />
        <Route path="/ranking-history" element={<RankingHistory />} />
        {/* <Route path="/my-position" element={<MyCurrentPosition />} /> */}
        <Route path="/statistics" element={<RankingStatistics />} />
        <Route path="/rankinglist" element={<RankingList />} />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <AuthRoot allowedPrivileges={["admin"]}>
              <Routes>
                <Route path="/users" element={<UsersDashboard />} />
                <Route path="/apimanagement" element={<ApiManagement />} />
              </Routes>
            </AuthRoot>
          }
        />

        {/* Admin, Employees Routes */}
        <Route
          path="/employees/*"
          element={
            <AuthRoot allowedPrivileges={["admin", "employee"]}>
              <Routes>
                <Route path="/addcategory" element={<AddCategoryPage />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/addfile" element={<AddFile />} />
                <Route path="/customemail" element={<CustomEmail />} />
                <Route path="/dashboard" element={<UsersDashboard />} />
              </Routes>
            </AuthRoot>
          }
        />

        {/* User Routes */}
        <Route
          path="/user/*"
          element={
            <AuthRoot allowedPrivileges={["client", "admin", "employee"]}>
              <Routes>
                <Route path="/profile" element={<Profile />} />
                <Route path="/changepassword" element={<ChangePassword />} />
                <Route path="/trackothers" element={<TrackOthers />} />
                <Route path="/api" element={<ApiInterface />} />
              </Routes>
            </AuthRoot>
          }
        />

        {/* Public Routes that require user to be logged out */}
        <Route
          path="/signup"
          element={
            <AuthRoot requireLogout={true}>
              <SignUp />
            </AuthRoot>
          }
        />

        <Route
          path="/login"
          element={
            <AuthRoot requireLogout={true}>
              <Login />
            </AuthRoot>
          }
        />

        <Route
          path="/reset-password"
          element={
            <AuthRoot requireLogout={true}>
              <PasswordReset />
            </AuthRoot>
          }
        />

        <Route
          path="/new-password"
          element={
            <AuthRoot requireLogout={true}>
              <ChangePasswordAfterReset />
            </AuthRoot>
          }
        />

        <Route
          path="/mailverification"
          element={
            <AuthRoot requireLogout={true}>
              <MailVerification />
            </AuthRoot>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
