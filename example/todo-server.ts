import express from 'express';

const app = express();


interface Todo {
  id: number,
  message: string;
  dueDate: string;
  completed: boolean;
}

let counter: number = 0;
const todoItems: Todo[] = [];



app.use(express.urlencoded({extended: false}));
app.use(express.json());


app.get('/api/todos', (req, res) => {
  res.send(todoItems);
});

app.get('/api/todos/detail', (req, res) => {
  res.send(todoItems.find(a=>a.id == req.query.id));
});

app.post('/api/todos', (req, res) => {
  const item = {
    id: counter++,
    message: req.body.message,
    dueDate: new Date().toISOString(),
    completed: false,
  };
  todoItems.push(item);
  res.send(item);
});

app.delete('/api/todos', (req, res) => {
  todoItems.splice(todoItems.findIndex(a => a.id == req.query.id), 1);
  res.send({});
});

app.put('/api/todos/complete', (req, res) => {
  const todo = todoItems.find(a => a.id == req.body.id);
  todo.completed = !todo.completed;
  res.send(todo);
});

app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}`));
process.on('uncaughtException', (err) => {
  console.log(err);
});
