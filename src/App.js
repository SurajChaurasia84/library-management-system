import { useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import "./App.css";
import {
  borrowBook,
  createBook,
  createMember,
  firebaseConfigured,
  removeBook,
  removeMember,
  returnBook,
  subscribeToBooks,
  subscribeToMembers,
  subscribeToTransactions,
  updateBook,
} from "./services/libraryService";

const emptyBookForm = {
  title: "",
  author: "",
  category: "",
  totalCopies: 1,
  shelf: "",
  description: "",
};

const emptyMemberForm = {
  name: "",
  email: "",
  department: "",
};

function App() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [bookForm, setBookForm] = useState(emptyBookForm);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [editingBookId, setEditingBookId] = useState(null);
  const [bookQuery, setBookQuery] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [activeTab, setActiveTab] = useState("catalog");
  const [activityFilter, setActivityFilter] = useState("all");
  const [statusMessage, setStatusMessage] = useState({ type: "idle", text: "" });
  const contentSectionRef = useRef(null);

  useEffect(() => {
    if (!firebaseConfigured) {
      setStatusMessage({
        type: "warning",
        text: "Firebase config is missing. Add REACT_APP_FIREBASE_* values to enable live data.",
      });
      return undefined;
    }

    const unsubBooks = subscribeToBooks(setBooks, setStatusMessage);
    const unsubMembers = subscribeToMembers(setMembers, setStatusMessage);
    const unsubTransactions = subscribeToTransactions(setTransactions, setStatusMessage);

    return () => {
      unsubBooks();
      unsubMembers();
      unsubTransactions();
    };
  }, []);

  const filteredBooks = useMemo(() => {
    const query = bookQuery.trim().toLowerCase();
    return books.filter((book) =>
      [book.title, book.author, book.category, book.shelf]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [books, bookQuery]);

  const filteredMembers = useMemo(() => {
    const query = memberQuery.trim().toLowerCase();
    return members.filter((member) =>
      [member.name, member.email, member.department]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [members, memberQuery]);

  const stats = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((sum, book) => sum + Number(book.totalCopies || 0), 0);
    const availableCopies = books.reduce(
      (sum, book) => sum + Number(book.availableCopies || 0),
      0
    );
    const issuedBooks = Math.max(totalCopies - availableCopies, 0);
    return {
      totalTitles,
      totalCopies,
      availableCopies,
      issuedBooks,
      activeMembers: members.length,
    };
  }, [books, members]);

  const selectedBook = books.find((book) => book.id === selectedBookId);
  const selectedMember = members.find((member) => member.id === selectedMemberId);
  const filteredActivity = useMemo(() => {
    if (activityFilter === "all") {
      return transactions;
    }

    return transactions.filter((transaction) => transaction.status === activityFilter);
  }, [activityFilter, transactions]);

  function showMessage(type, text) {
    setStatusMessage({ type, text });

    if (type === "error") {
      toast.error(text);
      return;
    }

    if (type === "success") {
      toast.success(text);
      return;
    }

    if (type === "warning") {
      toast(text, {
        icon: "!",
      });
    }
  }

  async function handleBookSubmit(event) {
    event.preventDefault();

    try {
      if (editingBookId) {
        const existingBook = books.find((book) => book.id === editingBookId);
        const previousTotal = Number(existingBook?.totalCopies || 0);
        const previousAvailable = Number(existingBook?.availableCopies || 0);
        const nextTotal = Number(bookForm.totalCopies || 0);
        const borrowedCount = Math.max(previousTotal - previousAvailable, 0);

        await updateBook(editingBookId, {
          ...bookForm,
          totalCopies: nextTotal,
          availableCopies: Math.max(nextTotal - borrowedCount, 0),
        });
        showMessage("success", "Book updated successfully.");
      } else {
        await createBook({ ...bookForm, totalCopies: Number(bookForm.totalCopies || 0) });
        showMessage("success", "Book added to the catalog.");
      }

      setBookForm(emptyBookForm);
      setEditingBookId(null);
    } catch (error) {
      showMessage("error", error.message || "Unable to save the book.");
    }
  }

  async function handleMemberSubmit(event) {
    event.preventDefault();

    try {
      await createMember(memberForm);
      setMemberForm(emptyMemberForm);
      showMessage("success", "Member registered successfully.");
    } catch (error) {
      showMessage("error", error.message || "Unable to save the member.");
    }
  }

  async function handleBorrow(event) {
    event.preventDefault();

    try {
      await borrowBook(selectedBookId, selectedMemberId, {
        bookTitle: selectedBook?.title || "Unknown title",
        memberName: selectedMember?.name || "Unknown member",
      });
      setSelectedBookId("");
      showMessage("success", "Book issued successfully.");
    } catch (error) {
      showMessage("error", error.message || "Unable to issue this book.");
    }
  }

  async function handleReturn(transactionId) {
    try {
      await returnBook(transactionId);
      showMessage("success", "Book returned and inventory updated.");
    } catch (error) {
      showMessage("error", error.message || "Unable to return this book.");
    }
  }

  async function handleDeleteBook(bookId) {
    try {
      await removeBook(bookId);
      if (editingBookId === bookId) {
        setBookForm(emptyBookForm);
        setEditingBookId(null);
      }
      showMessage("success", "Book removed from the catalog.");
    } catch (error) {
      showMessage("error", error.message || "Unable to delete this book.");
    }
  }

  async function handleDeleteMember(memberId) {
    try {
      await removeMember(memberId);
      if (selectedMemberId === memberId) {
        setSelectedMemberId("");
      }
      showMessage("success", "Member removed successfully.");
    } catch (error) {
      showMessage("error", error.message || "Unable to delete this member.");
    }
  }

  function startEditing(book) {
    setBookForm({
      title: book.title || "",
      author: book.author || "",
      category: book.category || "",
      totalCopies: Number(book.totalCopies || 1),
      shelf: book.shelf || "",
      description: book.description || "",
    });
    setEditingBookId(book.id);
    setActiveTab("catalog");
  }

  function openSection(tabName) {
    setActiveTab(tabName);

    requestAnimationFrame(() => {
      contentSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <div className="app-shell">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2800,
          style: {
            background: "rgba(8, 17, 31, 0.96)",
            color: "#f5f7fb",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
          },
          success: {
            iconTheme: {
              primary: "#84efc8",
              secondary: "#08111f",
            },
          },
          error: {
            iconTheme: {
              primary: "#ff9fb7",
              secondary: "#08111f",
            },
          },
        }}
      />
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />
      <main className="dashboard">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">Smart Library Management System</span>
            <h1>Manage books, members, and circulation in one digital workspace.</h1>
            <p>
              A focused library dashboard with live Firestore syncing, clean card layouts,
              issue and return workflows, and a soft animated background.
            </p>
            <div className="hero-actions">
              <button type="button" onClick={() => openSection("catalog")}>Open catalog</button>
              <button
                type="button"
                className="secondary"
                onClick={() => openSection("circulation")}
              >
                Issue a book
              </button>
            </div>
          </div>
          <div className="hero-stats">
            <StatCard label="Book Titles" value={stats.totalTitles} accent="blue" />
            <StatCard label="Total Copies" value={stats.totalCopies} accent="gold" />
            <StatCard label="Available Now" value={stats.availableCopies} accent="green" />
            <StatCard label="Issued Books" value={stats.issuedBooks} accent="rose" />
            <StatCard label="Members" value={stats.activeMembers} accent="violet" />
          </div>
        </section>

        <section className="status-strip">
          <div>
            <strong>Backend:</strong>{" "}
            {firebaseConfigured ? "Firebase connected through environment config." : "Firebase not configured yet."}
          </div>
          <div className={`status-pill ${statusMessage.type}`}>{statusMessage.text || "Ready"}</div>
        </section>

        <nav className="tab-row" aria-label="Library sections">
          {[
            ["catalog", "Catalog"],
            ["members", "Members"],
            ["circulation", "Circulation"],
            ["activity", "Activity"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={activeTab === key ? "active" : ""}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <section className="content-grid single-column" ref={contentSectionRef}>
          <div className="primary-column">
            {activeTab === "catalog" && (
              <CatalogSection
                bookForm={bookForm}
                editingBookId={editingBookId}
                filteredBooks={filteredBooks}
                bookQuery={bookQuery}
                onBookQueryChange={setBookQuery}
                onBookFormChange={setBookForm}
                onSubmit={handleBookSubmit}
                onEdit={startEditing}
                onDelete={handleDeleteBook}
                onCancelEdit={() => {
                  setBookForm(emptyBookForm);
                  setEditingBookId(null);
                }}
              />
            )}

            {activeTab === "members" && (
              <MembersSection
                memberForm={memberForm}
                members={filteredMembers}
                memberQuery={memberQuery}
                onMemberQueryChange={setMemberQuery}
                onMemberFormChange={setMemberForm}
                onSubmit={handleMemberSubmit}
                onDelete={handleDeleteMember}
              />
            )}

            {activeTab === "circulation" && (
              <CirculationSection
                books={books}
                members={members}
                transactions={transactions}
                selectedBookId={selectedBookId}
                selectedMemberId={selectedMemberId}
                onBookChange={setSelectedBookId}
                onMemberChange={setSelectedMemberId}
                onSubmit={handleBorrow}
                onReturn={handleReturn}
              />
            )}

            {activeTab === "activity" && (
              <ActivitySection
                activityFilter={activityFilter}
                filteredActivity={filteredActivity}
                onFilterChange={setActivityFilter}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function CatalogSection({
  bookForm,
  editingBookId,
  filteredBooks,
  bookQuery,
  onBookQueryChange,
  onBookFormChange,
  onSubmit,
  onEdit,
  onDelete,
  onCancelEdit,
}) {
  return (
    <section className="panel fade-card">
      <div className="panel-heading">
        <div>
          <h2>{editingBookId ? "Edit book" : "Add a new book"}</h2>
          <p>Keep your collection organized with complete metadata and stock counts.</p>
        </div>
      </div>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Title
          <input
            value={bookForm.title}
            onChange={(event) => onBookFormChange((current) => ({ ...current, title: event.target.value }))}
            placeholder="Enter book name"
            required
          />
        </label>
        <label>
          Author
          <input
            value={bookForm.author}
            onChange={(event) => onBookFormChange((current) => ({ ...current, author: event.target.value }))}
            placeholder="Enter author name"
            required
          />
        </label>
        <label>
          Category
          <input
            value={bookForm.category}
            onChange={(event) => onBookFormChange((current) => ({ ...current, category: event.target.value }))}
            placeholder="Self development"
            required
          />
        </label>
        <label>
          Edition
          <input
            value={bookForm.shelf}
            onChange={(event) => onBookFormChange((current) => ({ ...current, shelf: event.target.value }))}
            placeholder="A-12"
            required
          />
        </label>
        <label>
          Copies
          <input
            type="number"
            min="1"
            value={bookForm.totalCopies}
            onChange={(event) =>
              onBookFormChange((current) => ({ ...current, totalCopies: event.target.value }))
            }
            required
          />
        </label>
        <label className="full-span">
          Description
          <textarea
            rows="4"
            value={bookForm.description}
            onChange={(event) =>
              onBookFormChange((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Short summary, edition notes, or internal remarks"
          />
        </label>
        <div className="form-actions full-span">
          <button type="submit">{editingBookId ? "Update book" : "Save book"}</button>
          {editingBookId && (
            <button type="button" className="secondary" onClick={onCancelEdit}>
              Cancel edit
            </button>
          )}
        </div>
      </form>
      <div className="panel-heading list-heading">
        <div>
          <h2>Catalog</h2>
          <p>Search and manage every title from one place.</p>
        </div>
        <input
          className="search-input"
          placeholder="Search books by title, author, category, or shelf"
          value={bookQuery}
          onChange={(event) => onBookQueryChange(event.target.value)}
        />
      </div>
      <div className="book-grid">
        {filteredBooks.map((book) => (
          <article className="book-card" key={book.id}>
            <div className="book-card-top">
              <span className="category-chip">{book.category}</span>
              <span
                className={`availability ${Number(book.availableCopies || 0) > 0 ? "available" : "issued"}`}
              >
                {Number(book.availableCopies || 0) > 0 ? "Available" : "Fully issued"}
              </span>
            </div>
            <h3>{book.title}</h3>
            <p className="muted">{book.author}</p>
            <p>{book.description || "No description added yet."}</p>
            <div className="meta-row">
              <span>Shelf {book.shelf}</span>
              <span>{book.availableCopies || 0}/{book.totalCopies || 0} in stock</span>
            </div>
            <div className="card-actions">
              <button type="button" onClick={() => onEdit(book)}>Edit</button>
              <button type="button" className="danger" onClick={() => onDelete(book.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MembersSection({
  memberForm,
  members,
  memberQuery,
  onMemberQueryChange,
  onMemberFormChange,
  onSubmit,
  onDelete,
}) {
  return (
    <section className="panel fade-card">
      <div className="panel-heading">
        <div>
          <h2>Register members</h2>
          <p>Create reader records for students, staff, or external borrowers.</p>
        </div>
      </div>
      <form className="form-grid compact-grid" onSubmit={onSubmit}>
        <label>
          Full name
          <input
            value={memberForm.name}
            onChange={(event) => onMemberFormChange((current) => ({ ...current, name: event.target.value }))}
            placeholder="Enter student name"
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={memberForm.email}
            onChange={(event) => onMemberFormChange((current) => ({ ...current, email: event.target.value }))}
            placeholder="student@gmail.com"
            required
          />
        </label>
        <label>
          Department
          <input
            value={memberForm.department}
            onChange={(event) =>
              onMemberFormChange((current) => ({ ...current, department: event.target.value }))
            }
            placeholder="Information Technology"
            required
          />
        </label>
        <div className="form-actions full-span">
          <button type="submit">Add member</button>
        </div>
      </form>
      <div className="panel-heading list-heading">
        <div>
          <h2>Member directory</h2>
          <p>Quick access to your active library members.</p>
        </div>
        <input
          className="search-input"
          placeholder="Search members by name, email, or department"
          value={memberQuery}
          onChange={(event) => onMemberQueryChange(event.target.value)}
        />
      </div>
      <div className="member-list">
        {members.map((member) => (
          <article className="member-card" key={member.id}>
            <div>
              <h3>{member.name}</h3>
              <p>{member.email}</p>
              <span>{member.department}</span>
            </div>
            <button type="button" className="danger" onClick={() => onDelete(member.id)}>
              Remove
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function CirculationSection({
  books,
  members,
  transactions,
  selectedBookId,
  selectedMemberId,
  onBookChange,
  onMemberChange,
  onSubmit,
  onReturn,
}) {
  return (
    <section className="panel fade-card">
      <div className="panel-heading">
        <div>
          <h2>Issue books</h2>
          <p>Match a reader with an available title and keep stock accurate in Firestore.</p>
        </div>
      </div>
      <form className="form-grid compact-grid" onSubmit={onSubmit}>
        <label>
          Select member
          <select value={selectedMemberId} onChange={(event) => onMemberChange(event.target.value)} required>
            <option value="">Choose a member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} - {member.department}
              </option>
            ))}
          </select>
        </label>
        <label>
          Select book
          <select value={selectedBookId} onChange={(event) => onBookChange(event.target.value)} required>
            <option value="">Choose a book</option>
            {books
              .filter((book) => Number(book.availableCopies || 0) > 0)
              .map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} - {book.availableCopies} available
                </option>
              ))}
          </select>
        </label>
        <div className="form-actions full-span">
          <button type="submit">Issue book</button>
        </div>
      </form>
      <div className="transaction-list">
        {transactions.map((transaction) => (
          <article className="transaction-card" key={transaction.id}>
            <div>
              <h3>{transaction.bookTitle}</h3>
              <p>{transaction.memberName}</p>
              <span>
                Borrowed on {formatDate(transaction.borrowedAt)} | Status {transaction.status}
              </span>
            </div>
            {transaction.status === "borrowed" ? (
              <button type="button" className="secondary" onClick={() => onReturn(transaction.id)}>
                Mark returned
              </button>
            ) : (
              <span className="returned-badge">Returned {formatDate(transaction.returnedAt)}</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function ActivitySection({ activityFilter, filteredActivity, onFilterChange }) {
  return (
    <section className="panel fade-card">
      <div className="panel-heading">
        <div>
          <h2>Activity history</h2>
          <p>All saved circulation records with quick filters for borrow and return activity.</p>
        </div>
      </div>
      <div className="activity-filters">
        {[
          ["all", "All"],
          ["borrowed", "Borrow"],
          ["returned", "Return"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={activityFilter === value ? "active" : ""}
            onClick={() => onFilterChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="activity-feed">
        {filteredActivity.map((transaction) => (
          <article className="activity-item" key={transaction.id}>
            <div className="timeline-dot" />
            <div>
              <h3>{transaction.bookTitle}</h3>
              <p>
                {transaction.memberName} {transaction.status === "borrowed" ? "borrowed" : "returned"} this title.
              </p>
              <span>
                {transaction.status === "borrowed"
                  ? formatDate(transaction.borrowedAt)
                  : formatDate(transaction.returnedAt)}
              </span>
            </div>
          </article>
        ))}
        {filteredActivity.length === 0 && (
          <article className="activity-empty">
            <h3>No activity found</h3>
            <p>There are no saved records in this category yet.</p>
          </article>
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <article className={`stat-card ${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function formatDate(value) {
  if (!value) {
    return "Pending";
  }

  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default App;
