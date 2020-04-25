// app.js
//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
// underscore is lodash convention
const _ = require("lodash");
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect('mongodb://localhost:27017/todolistDB', { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = new mongoose.Schema({name: String});
const Item = mongoose.model("Item", itemsSchema);
const item01 = new Item({name: "Sample item 01"});
const item02 = new Item({name: "Item 02"});
const item03 = new Item({name: "Item 03"});
const defaultItems = [item01, item02];

const listSchema = {name: String, items: [itemsSchema]};
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({},function(err,foundItems){
  if (foundItems.length === 0){
    // add default items
    Item.insertMany(defaultItems, function(err){
      if (err){
      console.log(err);
      } else {
      console.log("Items are added.");
    }});
    res.redirect("/");
  } else {
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  };});
});

app.get("/:customListName", function(req,res){
  // console.log(req.params.customListName);
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName},function(err, foundList){
    if (!err){
      if (!foundList){
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
        console.log("New list created!");
      } else
        //show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
        console.log("Item added. Rendering...");
    }
  });
});

app.post("/", function(req, res){
  // add new items
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({name:itemName});

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name:listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }});


app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemId,function(err){
      if (!err) {
        console.log("Successfully deleted item.");
        res.redirect("/");
      }
    });
  }
  else {
    List.findOneAndUpdate({name: listName},{$pull: {items:{_id: checkedItemId}}}, function(err, foundList){
      if (!err){res.redirect("/" + listName);}
    });
  }
});



app.listen(3000, function() {console.log("Server started on port 3000");});
