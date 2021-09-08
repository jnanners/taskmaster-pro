var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  //check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

//checks due date
var auditTask = function(taskEl){
  //get date from task element
  var date = $(taskEl).find("span").text().trim();
  
  //convert to moment object, setting time to 5pm because it defaults to 12am
  var time = moment(date, "L").set("hour", 17);
  
  //remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  //apply new class if task due date is near/over due date
  if(moment().isAfter(time)){
    $(taskEl).addClass("list-group-item-danger");
  }
  //apply new class if task due date is 2 or fewer days away
  //Math.abs gives us the absolute value, because the difference between now and 2 days in the future is -2
  else if(Math.abs(moment().diff(time, "days")) <= 2){
    $(taskEl).addClass("list-group-item-warning");
  }
};


//datepicker 
$("#modalDueDate").datepicker({
  minDate: 1
});


//allow drag to drop deletion
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  over: function(){
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(){
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  drop: function(event, ui){
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active");
  }
  //no need to call saveTasks() because removing a task from an list triggers a .sortable() update()
});


//make tasks sortable and able to save after sorting
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event, ui){
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event, ui){
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event){
    $(event.target).addClass("dropover-active");
  },
  out: function(event){
    $(event.target).removeClass("dropover-active");
  },
  update: function(event){
    //array to store the task data in
    var tempArr = [];

    //loop over current set of children in sortable list
    $(this).children().each(function(){
      //inside the callback function $(this) referes to the child element at that index
      var text = $(this)
        .find("p")
        .text()
        .trim();

      var date = $(this)
        .find("span")
        .text()
        .trim();

      //add task data to the temp array as an object
      tempArr.push({
        text: text,
        date: date
      });
    });
    //trim down list's ID to match object property
    var arrName = $(this)
      .attr("id")
      .replace("list-", "");

    //update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

//when p element is clicked make it an editable textarea
$(".list-group").on("click", "p", function(){
  var text = $(this)
    .text()
    .trim();
  
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);

  $(this).replaceWith(textInput);

  textInput.trigger("focus");
});

//blur event that will trigger when users click off of the textarea
//then collects current value of the element, the parent elements ID, and the elements position on the list
//these data points will be used to update the correct task in the tasks object
$(".list-group").on("blur", "textarea", function(){
  //get the textarea's current value/text
  var text = $(this)
    .val()
    .trim();

  //get parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  //get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  //return the task object at the given array [status], at the given index in the array [index]
  //and set its .text property to the new text
  tasks[status][index].text = text;
  saveTasks();

  //convert textarea back into a p element
  //recreate p element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);
  
  //replace textarea with p element
  $(this).replaceWith(taskP);
});


//due date was clicked
$(".list-group").on("click", "span", function(){
  //get current text
  var date = $(this)
    .text()
    .trim();

  //create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  //swap out elements
  $(this).replaceWith(dateInput);

  //enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function(){
      //when calender is closed force a change event on dateInput so replacement function bellow happens
      $(this).trigger("change");
    }
  });

  //automatically focus on new element
  dateInput.trigger("focus");
});

//blur event that will trigger when user clicks off date input area
//blur event switched to change event because of datepicker issue with user clicking off area
$(".list-group").on("change", "input[type='text']", function(){
  //get current text
  var date = $(this)
    .val()
    .trim();

  //get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  //get the taks's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  //update task in array and re-save to localStorage
  tasks[status][index].date = date;
  saveTasks();

  //recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  //replace input with span element
  $(this).replaceWith(taskSpan);

   //pass tasks <li> element into auditTask() to check new due date
   auditTask($(taskSpan).closest(".list-group-item"));
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();

setInterval(function(){
  $(".card .list-group-item").each(function(index, el){
    auditTask(el);
  });
}, (1000 * 60) * 30);
