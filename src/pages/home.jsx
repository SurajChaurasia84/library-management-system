import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function Home() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "books"), (snapshot) => {
      setBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-5">
      <h1 className="text-3xl font-bold mb-4">Library</h1>

      <input
        className="border p-2 mb-4 w-full"
        placeholder="Search books..."
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid md:grid-cols-3 gap-4">
        {filtered.map(book => (
          <div key={book.id} className="p-4 shadow rounded bg-white">
            <h2 className="text-xl font-semibold">{book.title}</h2>
            <p>{book.author}</p>
            <p>{book.category}</p>
            <span className={`text-sm ${
              book.status === "Available" ? "text-green-600" : "text-red-600"
            }`}>
              {book.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}