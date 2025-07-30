import React from "react";
import EmailForm from "../components/EmailForm";
import AdminSidebar from "../components/AdminSideBar";

const CustomEmail = () => {
  return (
    <div className="d-flex">
      <AdminSidebar />
      <div className="flex-grow-1">
        <EmailForm />
      </div>
    </div>
  );
};

export default CustomEmail;
