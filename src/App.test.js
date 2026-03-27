import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./services/libraryService", () => ({
  firebaseConfigured: false,
  subscribeToBooks: () => () => {},
  subscribeToMembers: () => () => {},
  subscribeToTransactions: () => () => {},
  createBook: jest.fn(),
  updateBook: jest.fn(),
  removeBook: jest.fn(),
  createMember: jest.fn(),
  removeMember: jest.fn(),
  borrowBook: jest.fn(),
  returnBook: jest.fn(),
}));

test("renders the professional library management heading", () => {
  render(<App />);
  expect(screen.getByText(/professional library management/i)).toBeInTheDocument();
});
