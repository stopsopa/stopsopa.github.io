import React, { useEffect, useState } from "react";
import { render } from "react-dom";
import useCustomState from "../useCustomState";

/**
 * Todo item interface
 */
interface TodoItem {
  text: string;
  done: boolean;
  createdAt: string;
}

const section = "todo_example";

/**
 * Todo Example component using useCustomState hook
 */
const Main = () => {
  const [todos, setTodos] = useState<Record<string, TodoItem> | null>(null);
  const [text, setText] = useState("");
  const [selectedItem, setSelectedItem] = useState<{ key: string; data: TodoItem } | null>(null);

  const { error, id, set, get, del, push } = useCustomState({
    section,
  });

  const refreshTodos = async () => {
    const data = await get("todos");
    setTodos(data || {});
  };

  const handleFetchOne = async (key: string) => {
    const single = await get<TodoItem>(`todos/${key}`);
    setSelectedItem({ key, data: single });
  };

  useEffect(() => {
    if (id) {
      refreshTodos();
    }
  }, [id]);

  if (error) {
    return <pre>{JSON.stringify({ error }, null, 4)}</pre>;
  }

  if (!id) {
    return <div>Connecting to custom state...</div>;
  }

  if (todos === null) {
    return <div>Loading todos...</div>;
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length === 0) {
      return;
    }

    await push({
      key: "todos",
      data: {
        text: text.trim(),
        done: false,
        createdAt: new Date().toISOString(),
      },
    });

    setText("");
    await refreshTodos();
  };

  const handleToggle = async (key: string, current: TodoItem) => {
    await set({
      key: ["todos", key],
      data: {
        ...current,
        done: !current.done,
      },
    });
    await refreshTodos();
  };

  const handleDelete = async (key: string) => {
    await del(`todos/${key}`);
    await refreshTodos();
  };

  return (
    <div>
      <a href="../..">up ..</a>
      <hr />
      <h2>Todo List</h2>
      <form onSubmit={handleAdd}>
        <input
          data-testid="todo-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New todo item..."
        />
        <button data-testid="todo-add-btn" type="submit">
          Add
        </button>
      </form>

      <ul data-testid="todo-list">
        {Object.entries(todos).map(([key, item]) => (
          <li key={key}>
            <input
              data-testid={`todo-check-${key}`}
              type="checkbox"
              checked={item.done}
              onChange={() => handleToggle(key, item)}
            />
            <span
              style={{
                textDecoration: item.done ? "line-through" : "none",
                marginLeft: "8px",
                marginRight: "8px",
              }}
            >
              {item.text}
            </span>
            <button data-testid={`todo-view-${key}`} onClick={() => handleFetchOne(key)}>
              view details (fetch single)
            </button>
            <button data-testid={`todo-del-${key}`} onClick={() => handleDelete(key)}>
              delete
            </button>
          </li>
        ))}
      </ul>

      {selectedItem && (
        <div data-testid="todo-details-box" style={{ marginTop: "16px", padding: "8px", border: "1px solid #ccc" }}>
          <h4>Single Fetched Item ({selectedItem.key})</h4>
          <pre>{JSON.stringify(selectedItem.data, null, 2)}</pre>
          <button data-testid="todo-close-details" onClick={() => setSelectedItem(null)}>
            Close
          </button>
        </div>
      )}

      <hr />
      <div>
        <a href="urlwizzard.schema://urlwizzard.hostnegotiated/viewer.html?file=%2Fpages%2Fdatabases%2Ffirebase%2FUSAGE.md">
          USAGE.md
        </a>
      </div>
      <div>
        <a href="https://console.firebase.google.com/">https://console.firebase.google.com/</a>
      </div>
    </div>
  );
};

const appContainer = document.getElementById("app");
if (appContainer) {
  render(<Main />, appContainer);
}
