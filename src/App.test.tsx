// Testing using Vitest framework
import { describe, it, expect } from 'vitest';
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import Post from './betPost';



// What to test:

// 1. Rendering of the App component
// 2. Rendering of the Post component with correct props
// 3. Functionality of the "Create Bet" button
// 4. Functionality of the "Pass Time" button (if implemented)
// 5. Ending bets and updating the leaderboard
// 6. Display of error messages and loading state
// 7. Interaction with the backend API (mocking API calls)
// 8. Responsiveness and styling of components
// 9. State management and updates when placing bets
// 10. Display of the leaderboard and correct sorting of users
// 11. Handling of edge cases (e.g., no markets available, API errors)

describe('App Component', () => {
  it('renders the App component', () => {
    render(<App />);
    expect(screen.getByText('G R I N G A M B L I N G')).toBeInTheDocument();
  });
  
  it('renders Post components with correct props', () => {
    const mockPosts = [
        { id: 1, title: 'Bet 1', description: 'Description 1' },
        { id: 2, title: 'Bet 2', description: 'Description 2' },
        ];
    render(<App />);
    mockPosts.forEach(Post => {
        expect(screen.getByText(Post.title)).toBeInTheDocument();
        expect(screen.getByText(Post.description)).toBeInTheDocument();
    });
    });

  it('handles Create Bet button click', () => {
    render(<App />);
    const createBetButton = screen.getByText('Create Bet');
    fireEvent.click(createBetButton);
    expect(screen.getByText('Create Bet Modal')).toBeInTheDocument();
 });
});