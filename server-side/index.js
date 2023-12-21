const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken");

const app = express()

const shop = [
    {
     ISBN: "978-0-123456-7",
     Title: "Khan's Voyage",
     Author: "Muneeb",
     Reviews: [
           {
            Review:"This Book has Fantasy Story",
            userName: "muneebehsan"
           },
     ]
    },
    {
        ISBN: "978-0-123435-5",
        Title: "Death of the Laughing Corgi",
        Author: "Muneeb",
        Reviews: [
              {
               Review:"This Book has Mystery Story",
               userName: "muneebehsan"
              },
        ]
       },
       {
        ISBN: "978-0-123487-9",
        Title: "Hammer and The Ode",
        Author: "Subhan",
        Reviews: [
              {
               Review:"This Book has Romantic Story",
               userName: "subhan"
              },
        ]
       },
       {
        ISBN: "978-0-123429-1",
        Title: "Night Peril",
        Author: "Subhan",
        Reviews: [
              {
               Review:"This Book has Romantic Story",
               userName: "subhan"
              },
        ]
       },
       {
        ISBN: "978-0-123435-5",
        Title: "Shot for Mercy",
        Author: "Shahzaib",
        Reviews: [
              {
               Review:"This Book has Crime Story",
               userName: "shahzaib"
              },
        ]
       }
]

app.use(cors())
app.use(express.json())


const secretKey = "secret123";
const users = [];

app.get("/all-books", (req, res)=>{
    try{
      res.json(shop)
    }catch(err){
        console.error(err);
    }
})

app.get("/book-detail",  (req, res)=>{
    try{
        const authorName = req.query.author;
        const titleName = req.query.title;
        const ISBNCode = req.query.ISBN;

        let filteredBooks = [...shop];

        if (authorName) {
            filteredBooks = filteredBooks.filter(book => book.Author === authorName);
        }

        if (titleName) {
            filteredBooks = filteredBooks.filter(book => book.Title === titleName);
        }

        if (ISBNCode) {
            filteredBooks = filteredBooks.filter(book => book.ISBN === ISBNCode);
        }

        if (filteredBooks.length > 0) {
            res.json(filteredBooks);
        } else {
            res.json({ message: "No matching books found" });
        }
    }catch(err){
        console.error(err);
    }
} )

app.get("/book-review", (req, res)=>{
    try{
        const authorName = req.query.author;
        const titleName = req.query.title;
        const ISBNCode = req.query.ISBN;

        let filteredBooks = [...shop];

        if (authorName) {
            filteredBooks = filteredBooks.filter(book => book.Author === authorName);
        }

        if (titleName) {
            filteredBooks = filteredBooks.filter(book => book.Title === titleName);
        }

        if (ISBNCode) {
            filteredBooks = filteredBooks.filter(book => book.ISBN === ISBNCode);
        }
        if(filteredBooks.length > 0){
            const bookReviews = filteredBooks.map(book => book.Reviews);
            res.json(bookReviews)
        }else{
            res.json({Message: "Book not Found"})
        }

    }catch(err){
        console.error(err);
    }
})

app.post("/register", (req, res) => {
    try {
        const { username, password } = req.body;

           if (users.some(user => user.username === username)) {
            res.json({ message: "Username is already taken" });
            return;
        }

        const newUser = { username, password };
        users.push(newUser);

        res.json({ message: "User registered successfully", user: newUser });
    } catch (err) {
        console.error(err);
    }
});


app.post("/login", (req, res) => {
    try {
        const { username, password } = req.body;

        const loginUser = users.find(user => user.username === username && user.password === password);

        if (!loginUser) {
            res.json({ message: "Invalid credentials" });
            return;
        }

        const token = jwt.sign({ username }, secretKey, { expiresIn: "1h" });
        res.json({ message: "Login successful", token });
    } catch (err) {
        console.error(err);
      }
});

const authenticateJWT = (req, res, next) => {
    const token = req.header("x-auth-token");

    if (!token) {
        return res.status(401).json({ message: "Login First to Add any Review or Comment" });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid token." });
    }
};
app.post("/add-review", authenticateJWT, (req, res) => {
    try {
        const { ISBN, reviewText } = req.body;
        const username = req.user.username; 

        
        const book = shop.find(book => book.ISBN === ISBN);

        if (!book) {
            res.status(404).json({ message: "Book not found" });
            return;
        }

        book.Reviews.push({ Review: reviewText, userName: username });

        res.json({ message: "Review added successfully", review: { Review: reviewText, userName: username } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.get("/user-comments", authenticateJWT, (req, res) => {
    try {
        const username = req.user.username;

        const userComments = shop.reduce((result, book) => {
            book.Reviews.forEach(review => {
                if (review.userName === username) {
                    result.push({ ISBN: book.ISBN, Comment: review.Review });
                }
            });
            return result;
        }, []);

        res.json(userComments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put("/modify-review/:ISBN", authenticateJWT, (req, res) => {
    try {
        const ISBN = req.params.ISBN;
        const { newReviewText } = req.body;
        const username = req.user.username;

        const book = shop.find(book => book.ISBN === ISBN);

        if (!book) {
            res.status(404).json({ message: "Book not found" });
            return;
        }

        const reviewIndex = book.Reviews.findIndex(review => review.userName === username);

        if (reviewIndex === -1) {
            res.status(404).json({ message: "Review not found for the specified user" });
            return;
        }

        book.Reviews[reviewIndex].Review = newReviewText;

        res.json({ message: "Review modified successfully", updatedReview: book.Reviews[reviewIndex] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete("/delete-comment/:ISBN", authenticateJWT, (req, res) => {
    try {
        const ISBN = req.params.ISBN;
        const username = req.user.username;

        const book = shop.find(book => book.ISBN === ISBN);

        if (!book) {
            res.status(404).json({ message: "Book not found" });
            return;
        }

        const reviewIndex = book.Reviews.findIndex(review => review.userName === username);

        if (reviewIndex === -1) {
            res.status(404).json({ message: "Review not found for the specified user" });
            return;
        }

        book.Reviews.splice(reviewIndex, 1);

        res.json({ message: "Comment deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.listen("3001", ()=>{
    console.log("server running on 3001");
})