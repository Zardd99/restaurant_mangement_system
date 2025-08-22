import React from "react";

interface UserListsProps {
  params: { id: string };
}

const UserLists = ({ params }: UserListsProps) => {
  return <div>Users: {params.id}</div>;
};

export default UserLists;
