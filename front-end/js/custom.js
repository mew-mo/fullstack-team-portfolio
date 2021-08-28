(function() {

  // declaring the url
  let url;
  $.ajax({
    url: 'js/config.json',
    type: 'GET',
    dataType: 'json',
    success: function(configData) {
      url = `${configData.SERVER_URL}:${configData.SERVER_PORT}`;
    },
    error: function(error) {
      alert('Error:', error);
    }
  });

  // conditionals for calling code depending on what page the user is on
  // note for rane: i had to do this because the code would break if i ran the js and it was looking for an element that wasnt on the page being run (like if it was looking for the nonexistent login button on the user page)! if the code doesnt make sense lmk
  if($('body').data('title') === 'home-page') {
    // INDEX.HTML JS --------------------

    // login function to work with, i just needed to declare the session storage stuff for my code to work-- mess around with it as u need!!

    document.querySelector('#loginModalBtn').addEventListener('click', () => {
      $('#loginModal').modal('show');
    }, false);

    document.querySelector('#loginBtn').addEventListener('click', () => {
      event.preventDefault();
      let username = $('#loginUser').val();
      let password = $('#loginPass').val();

      if (username === '' || password === '') {
        alert('Please enter all of your details.');
      } else {
        $.ajax({
          url: `${url}/loginUser`,
          type: 'POST',
          data: {
            username: username,
            password: password
          },
          success: function(user) {
            if (user == 'Error: User not found. Please register') {
              alert('User not found: Please register as a new user or enter the correct details.');
            } else if (user == 'Error: Not authorized') {
              alert('Please try again with correct details.');
              $('#loginUser').val('');
              // field where they type the username
              $('#loginPass').val('');
              // field where they type the password
            } else {
              // session storage
              sessionStorage.setItem('userID', user._id);
              sessionStorage.setItem('userName', user.username);
              sessionStorage.setItem('userEmail', user.email);
              sessionStorage.setItem('userPass', user.password);
              $('#loginModal').modal('hide');
            } //else
          } //success
        }); //ajax ends
      } // else ends
    }, false);
    // login click ENDS

    // INDEX.HTML JS ENDS --------------------
  } else if ($('body').data('title') === 'user-page') {
    // USERS.HTML JS --------------------

    document.querySelector('.username-display').innerHTML = sessionStorage.getItem('userName');

    document.querySelector('#logoutBtn').addEventListener('click', () => {
      sessionStorage.clear();
      alert('You have been logged out.');
      window.location.href = 'index.html';
    }, false);
    // logout ENDS

    document.querySelector('#editUserBtn').addEventListener('click', () => {
      $('#editUserModal').modal('show');
    }, false);

    document.querySelector('#updateBtn').addEventListener('click', () => {

      event.preventDefault();
      let username = $('#changeUser').val();
      let email = $('#changeEmail').val();
      let password = $('#changePassword').val();
      let userId = sessionStorage.getItem('userID');

      // keeping old values if any fields are unchanged
      if (username == '') {
        username = sessionStorage.getItem('userName');
        console.log(username);
      } else if (email == '') {
        email = sessionStorage.getItem('userEmail');
        console.log(email);
      } else if (password == '') {
        password = sessionStorage.getItem('userPass');
        console.log(password);
      }

      console.log(username);
      // note: it's updating on the front end, but for some reason not sending new  values to mongoDB.. i do not know why
      $.ajax({
        url: `${url}/updateUser/:${userId}`,
        type: 'PATCH',
        data: {
          username: username,
          email: email,
          password: password,
          user_id: userId
        },
        success: function(data) {
          console.log(data);
          if (data == '401 error: user has no permission to update') {
            alert('401 error: user has no permission to update');
          } else {
            alert('Successfully updated your details.');

            // updating the session to match your updated details
            sessionStorage.setItem('userName', username);
            sessionStorage.setItem('userEmail', email);
            sessionStorage.setItem('userPass', password);

            document.querySelector('.username-display').innerHTML = sessionStorage.getItem('userName');
            $('#editUserModal').modal('hide');
          } //else
          $('#changeUser').val('');
          $('#changeEmail').val('');
          $('#changePassword').val('');
        }, //success
        error: function() {
          alert('Error: Can\'t call API');
        }
      });
    }, false);
    // update user click event ENDS

    document.querySelector('#editPfBtn').addEventListener('click', () => {
      window.location.href = 'portfolio.html';
    }, false);

    // USERS.HTML JS ENDS --------------------
  } else if ($('body').data('title') === 'portfolio-page') {
    // PORTFOLIO.HTML JS --------------------

    var cloudObject = {
      editItemId: false
    };
    // because we need to pull this object out of it's functional scope, passing it through this object to access it

    window.addEventListener('load', () => {
      $.ajax({
        url: `${url}/allItems`,
        type: 'GET',
        dataType: 'json',
        success: function(itemsFromDB) {
          for (var i = 0; i < itemsFromDB.length; i++) {
            document.querySelector('#allItems').innerHTML += `
            <div class="col-4 portfolio-item">
              <a href="${itemsFromDB[i].url}" target="_blank">
                <img src="${itemsFromDB[i].imgUrl}" class="item-preview">
              </a>
              <div class="item-text">
                <p>${itemsFromDB[i].name} &nbsp; • &nbsp; By ${itemsFromDB[i].author} </p>
                <button class="cta-btn pf-btn" data-title="${itemsFromDB[i]._id}">Edit</button>
                <button class="ghost-btn pf-btn" data-title="${itemsFromDB[i]._id}">Delete</button>
                <span class="data-name">${itemsFromDB[i].name}</span>
                <span class="data-imgurl">${itemsFromDB[i].imgUrl}</span>
                <span class="data-author">${itemsFromDB[i].author}</span>
                <span class="data-url">${itemsFromDB[i].url}</span>
              </div>
            </div>`;
          }
        }, //success ends
        error: function() {
          console.log('Error: Cannot GET');
          location.reload();
          // errors only have been happening when the page loads faster than it can connect to the DB. forcing a reload if there's an error allows the page to have the time to load data from the db.
        } //error ends
      }); //ajax ends
    });

    window.addEventListener('click', (e) => {
      if (e.target.innerHTML === 'Delete') {

        event.preventDefault();
        let delItemId = $(e.target).data('title');

        if (!sessionStorage.userID) {
          alert('401 Permission Denied: Please log in or register first.');
          return;
        }

        $.ajax({
          url: `${url}/deleteItem/${delItemId}`,
          type: 'DELETE',
          data: {
            user_id: sessionStorage.userID
          },
          success: function(data) {
            console.log(data);
            if (data == 'deleted') {
              alert('Successfully deleted');
              location.reload();
            } else {
              alert('There was a problem when trying to delete. Sorry!');
            }
          }, //success
          error: function() {
            console.log('Error: Can\'t call API');
          } //err
        }); //ajax

      } else if (e.target.innerHTML === 'Edit'){
        console.dir(e.target.parentNode);

        $('#changeItemTitle').val(e.target.parentNode.children[3].innerText);
        $('#changeImgUrl').val(e.target.parentNode.children[4].innerText);
        $('#changeAuthorName').val(e.target.parentNode.children[5].innerText);
        $('#changeItemUrl').val(e.target.parentNode.children[6].innerText);
        // filling the fields with existing data in case user wants to keep any aspects

        $('#updateItemModal').modal('show');
        let editItemId = $(e.target).data('title');
        cloudObject.editItemId = editItemId;
      }
    }, false);
    // delete item conditional ENDS

    // edit item conditional
    document.querySelector('#updateItemBtn').addEventListener('click', () => {

      event.preventDefault();

      let userId = sessionStorage.getItem('userID');
      let editItemId = cloudObject.editItemId;
      let name = $('#changeItemTitle').val();
      let imageUrl = $('#changeImgUrl').val();
      let author = $('#changeAuthorName').val();
      let itemUrl = $('#changeItemUrl').val();

      if (name == '' || imageUrl == '' || author == '' || url == '') {
        alert('Please fill all fields');
      } else {
        $.ajax({
          url: `${url}/updateItem/${editItemId}`,
          type: 'PATCH',
          data: {
            name: name,
            imgUrl: imageUrl,
            author: author,
            url: itemUrl,
            user_id: userId
          },
          success: function(data) {
            console.log(data);
            if (data == '401 error: user has no permission to update') {
              alert('401 error: user has no permission to update');
            } else {
              alert('Successfully updated the item!');
              $('#updateItemModal').modal('hide');
              location.reload();
            } //else
            $('#changeItemTitle').val('');
            $('#changeImgUrl').val('');
            $('#changeAuthorName').val('');
            $('#changeItemUrl').val('');
          }, //success
          error: function() {
            alert('Error: Can\'t call API');
          }
        });
      } //else
    }, false);
    // update item ENDS

    document.querySelector('#backBtn').addEventListener('click', () => {
      window.location.href = 'users.html';
    }, false);

    document.querySelector('.add-btn').addEventListener('click', () => {
      if (sessionStorage.getItem('userID')) {
        $('#addItemModal').modal('show');
      } else {
        alert('You don\'t have permission to do this. Please log in or register first.');
      }
    }, false);

    // add item FUNCTION
    document.querySelector('#addItemBtn').addEventListener('click', () => {

      event.preventDefault();

      let name = $('#inputItemTitle').val();
      let imageUrl = $('#inputImgUrl').val();
      let author = $('#inputAuthorName').val();
      let itemUrl = $('#inputItemUrl').val();
      let userId = sessionStorage.getItem('userID');

      if (name == '' || imageUrl == '' || author == '' || itemUrl == '') {
        alert('Please enter all of the necessary details.');
      } else {
        $.ajax({
          url: `${url}/addItem`,
          type: 'POST',
          data: {
            name: name,
            imgUrl: imageUrl,
            author: author,
            url: itemUrl,
            user_id: userId
          },
          success: function(product){
            alert('Porfolio piece successfully added!');
            $('#addItemModal').modal('hide');
            location.reload();
          },
          error: function(){
            console.log('Error: Can\'t call API');
          } //err
        }); //ajax
      } //else
    }, false);
    // add item function ENDS

    // PORTFOLIO.HTML JS ENDS--------------------
  }

}());
// iife ENDS
