import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, UserCircle, Briefcase, FileText } from 'lucide-react';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <LayoutDashboard className="sidebar-icon" size={24} />
        PO-FES
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard/client" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Briefcase size={20} />
          <span>Client Dashboard</span>
        </NavLink>
        <NavLink to="/feedback/new" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Submit Feedback</span>
        </NavLink>
        <NavLink to="/dashboard/teaching-staff" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Teaching Staff</span>
        </NavLink>
        <NavLink to="/dashboard/unit-coordinator" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <BookOpen size={20} />
          <span>Unit Coordinator</span>
        </NavLink>
        <NavLink to="/dashboard/industry-liaison" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <UserCircle size={20} />
          <span>Industry Liaison</span>
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
