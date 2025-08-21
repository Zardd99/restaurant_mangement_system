import React from "react";

interface UserListsProps {
  params: { id: string };
}

const UserLists = ({ params }: UserListsProps) => {
  return <div>Hello {params.id}</div>;
};

export default UserLists;
