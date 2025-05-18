import { Navigate, Outlet } from 'react-router-dom';
import { getToken } from "../utils/tokenHelper";

/**
 * AuthenticatedRoute component
 * 
 * This component checks if the user is authenticated by looking for a token
 * in localStorage. If the token exists, it renders the child routes via Outlet.
 * Otherwise, it redirects to the login page.
 */
const AuthenticatedRoute = () => {
  const isAuthenticated = getToken() !== null;
  
  // If user is not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default AuthenticatedRoute;