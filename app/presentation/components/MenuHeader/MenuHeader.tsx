import Link from "next/link";

const MenuHeader = () => (
  <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div className="animate-fade-in-up">
      <h2 className="text-4xl font-bold text-gray-900 mb-2">Our Menu</h2>
      <p className="text-gray-600 text-lg">
        Discover our carefully curated selections
      </p>
    </div>
    <Link href="/chef_special">
      <div className="bg-red-600 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:rotate-1">
        ✨ Chefs Specials
      </div>
    </Link>
  </div>
);

export default MenuHeader;
