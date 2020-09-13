const app = {
    profile: {
        id: 1,
        name: 'Nick',
    },
    currentDate: new Date(),
    lastPage: 'food-logs',
    lastDate: dateToString(new Date()),
};

let foods = null;

$(function () {
    // initialize elements
    foods = loadFood();

    app.lastPage = localStorage.getItem('app_lastPage');
    app.lastDate = localStorage.getItem('app_lastDate');

    // Load current date
    $('#enter-date-input').val(dateToString(app.currentDate));
    
    // Add event listeners
    $('#date-enter-button').click(() => goToDate());

    // Init pages
    init_foods();
    init_foodLogs();
    init_foodLog();

    // Load this page first to view
    //goToDate();
    loadPage(app.lastPage || 'foods');
    if (app.lastPage === 'food-log') {
        goToDate(app.lastDate);
    }
});

function init_foodLog() {
    $('#food').dropdown({
        values: foods,
        placeholder: 'Select Food',
        onChange: function (value, text, $selectedItem) {
            foodDropdownChange(value);
        }
    });

    $('#add-foods-button').click(addFoods);
}

function init_foods() {
    $('#add-food-button').click(() => {
        // Empty food form
        $('#add-edit-food-form input').val('');

        $('#add-food-modal')
            .modal({
                centered: false,
                duration: 200,
                onDeny: function () {

                },
                onApprove: saveFood,
            })
            .modal('show');
    });

    loadFoodsTable();
}

function loadFoodsTable() {
    let html = '';
    
    for (let f of foods) {
        html += `<div class="item">
        <i class="large edit outline middle aligned link icon" onclick="editFood(${f.value})"></i>
        <div class="content">
            <div class="header">
                ${f.name} - 1 ${f.units}
            </div>
            <div class="description">
                ${f.calories} Calories,
                ${f.fat} g Fat,
                ${f.carbs} g Carbs,
                ${f.protein} g Protein
            </div>
        </div>
    </div>`;
    }
    $('#foods-container').html(html);
}

function saveFood() {
    // Validate form
    // TODO

    // Save food
    const newFood = {
        value: $('#add-edit-food-form input[name="food-id"]').val(),
        name: $('#add-edit-food-form input[name="name"]').val(),
        units: $('#add-edit-food-form input[name="units"]').val(),
        servingSize: $('#add-edit-food-form input[name="serving-size"]').val(),
        calories: $('#add-edit-food-form input[name="calories"]').val(),
        fat: $('#add-edit-food-form input[name="fat"]').val(),
        carbs: $('#add-edit-food-form input[name="carbs"]').val(),
        protein: $('#add-edit-food-form input[name="protein"]').val(),
    };

    if (newFood.value === '') {
        newFood.value = (Math.max(...foods.map(f => f.value)) ?? 0) + 1;
        foods.push(newFood);
    } else {
        newFood.value = parseInt(newFood.value);
        foods[foods.findIndex(f => f.value === newFood.value)] = newFood;
        console.log(foods);
    }
    localStorage.setItem('foods', JSON.stringify(foods));

    loadFoodsTable();
}

function editFood(foodId) {
    // Empty food form
    $('#add-edit-food-form input').val('');

    const food = foods.filter(f => f.value === foodId)[0];
    $('#add-edit-food-form input[name="food-id"]').val(food.value);
    $('#add-edit-food-form input[name="name"]').val(food.name);
    $('#add-edit-food-form input[name="units"]').val(food.units);
    $('#add-edit-food-form input[name="serving-size"]').val(food.servingSize);
    $('#add-edit-food-form input[name="calories"]').val(food.calories);
    $('#add-edit-food-form input[name="fat"]').val(food.fat);
    $('#add-edit-food-form input[name="carbs"]').val(food.carbs);
    $('#add-edit-food-form input[name="protein"]').val(food.protein);

    $('#add-food-modal')
        .modal({
            centered: false,
            duration: 200,
            onDeny: function () {

            },
            onApprove: saveFood,
        })
        .modal('show');
}

function init_foodLogs() {
    // Get last 12 days of food logs
    const foodLogs = new Array(12);
    for (let i = foodLogs.length - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const foodLog = loadFoodLogs(app.profile.id, dateToString(date));
        foodLogs[i] = {
            date: date,
            entries: foodLog.length,
            calories: foodLog.reduce((acc, cur) => { const food = foods.filter(f => f.value === cur.foodId)[0]; return acc + cur.amount * (food?.calories ?? 0) / (food?.servingSize ?? 1); }, 0),
            fat: foodLog.reduce((acc, cur) => { const food = foods.filter(f => f.value === cur.foodId)[0]; return acc + cur.amount * (food?.fat ?? 0) / (food?.servingSize ?? 1); }, 0),
            carbs: foodLog.reduce((acc, cur) => { const food = foods.filter(f => f.value === cur.foodId)[0]; return acc + cur.amount * (food?.carbs ?? 0) / (food?.servingSize ?? 1); }, 0),
            protein: foodLog.reduce((acc, cur) => { const food = foods.filter(f => f.value === cur.foodId)[0]; return acc + cur.amount * (food?.protein ?? 0) / (food?.servingSize ?? 1); }, 0),
        };
    }
    
    $('#food-logs-container').html('');
    for (let fl of foodLogs) {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const isToday = dateToString(fl.date) === dateToString(today);
        const isYesterday = dateToString(fl.date) === dateToString(yesterday);

        $('#food-logs-container').append(`<div class="card">
    <div class="content">
      <div class="header">
        ${dateToNiceStringWithoutYear(fl.date)}${(isToday ? " (Today)" : (isYesterday ? " (Yesterday)" : ""))}
        <button class="ui icon compact button right floated ${(!isToday ? " basic" : " primary")}" title="Edit" onclick="goToDate('${dateToString(fl.date)}')"><i class="edit icon"></i> Edit</button>
      </div>
      <div class="meta">${fl.entries} entries</div>
      <div class="description ui list">
        <div class="item"><h4>${fl.calories} Calories</h4></div>
        <div class="content">
            <div class="list">
                <div class="item">${fl.fat} g Fat</div>
                <div class="item">${fl.carbs} g Carbs</div>
                <div class="item">${fl.protein} g Protein</div>
            </div>
        </div>
      </div>
    </div>
  </div>`);
    }

}

function loadPage(page) {
    $('.page').addClass('hidden');
    
    $(`#${page}-page.page`).removeClass('hidden');

    localStorage.setItem('app_lastPage', page);
}

function loadFood() {
    //const foods = [
    //    { value: 1, name: 'Chicken', units: 'oz', calories: 300, carbs: 10, fat: 4, protein: 16 },
    //    { value: 2, name: 'Hummus', units: 'oz', calories: 100, carbs: 10, fat: 12, protein: 4 },
    //    { value: 3, name: 'Peas', units: 'bag', calories: 100, carbs: 30, fat: 2, protein: 4 },
    //    { value: 4, name: 'Yogurt', units: 'cup', calories: 120, carbs: 2, fat: 1, protein: 12 },
    //];
    const foods = JSON.parse(localStorage.getItem('foods') || '[]');
    return foods;
}

function loadFoodLogs(profileId, date) {
    const foodLog = localStorage.getItem(`food-log_${profileId}_${date}`);
    if (foodLog !== null) {
        return JSON.parse(foodLog);
    } else {
        return [];
    }
}
function saveFoodLogs(profileId, date, foodLog) {
    localStorage.setItem(`food-log_${profileId}_${date}`, JSON.stringify(foodLog));
}
function appendFoodLogs(profileId, date, foodLog) {
    const existingFoodLog = loadFoodLogs(profileId, date);
    saveFoodLogs(profileId, date, existingFoodLog.concat(foodLog));
}
function deleteFoodLogRow(profileId, date, row) {
    const existingFoodLog = loadFoodLogs(profileId, date);
    saveFoodLogs(profileId, date, existingFoodLog.filter((fl, index) => index !== row));
    updateFoodLogTable(profileId, date);
}

function dateToString(date) {
    const newDate = new Date(date);
    newDate.setMinutes(date.getMinutes());
    return newDate.toISOString().substr(0, 10);
}
function dateToNiceString(date) {
    const newDate = new Date(date);
    newDate.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return newDate.toLocaleDateString();
}
function dateToNiceStringWithoutYear(date) {
    const newDate = new Date(date);
    newDate.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return (newDate.getMonth() + 1) + "/" + newDate.getDate();
}

function foodDropdownChange(value) {
    // Check if values entered to lock/unlock add button
    if (value === '') {
        $('#add-foods-button').addClass('disabled');
    } else {
        $('#add-foods-button').removeClass('disabled');
    }
}

function updateFoodLogTable(profileId, date) {
    let html = '';
    const foodLog = loadFoodLogs(profileId, date);
    const totals = {
        calories: 0,
        fat: 0,
        carbs: 0,
        protein: 0,
    };
    let row = 0;
    for (let fl of foodLog) {
        if (!(fl.amount !== '' && fl.amount !== null && fl.amount !== undefined && fl.amount > 0)) {
            console.error(fl);
        }
        const food = foods.filter(f => f.value === fl.foodId)[0];
        const calories = (food?.calories ?? 0) * fl.amount / (food?.servingSize ?? 1);
        const fat = (food?.fat ?? 0) * fl.amount / (food?.servingSize ?? 1);
        const carbs = (food?.carbs ?? 0) * fl.amount / (food?.servingSize ?? 1);
        const protein = (food?.protein ?? 0) * fl.amount / (food?.servingSize ?? 1);

        totals.calories += calories;
        totals.fat += fat;
        totals.carbs += carbs;
        totals.protein += protein;

        html += `<tr>
                    <td>${food?.name}</td>
                    <td>${fl.amount} ${food?.units}</td>
                    <td class="right aligned">${calories}</td>
                    <td class="right aligned">${fat}</td>
                    <td class="right aligned">${carbs}</td>
                    <td class="right aligned">${protein}</td>
                    <td class="center aligned"><i class="minus circle icon red link" onclick="deleteFoodLogRow(${app.profile.id}, '${date}', ${row})"></i></td>
            </tr>`
        row++;
    }
    $('#food-log-table > tbody').html(html);
    $('#food-log-table #totals-calories').text(totals.calories);
    $('#food-log-table #totals-fat').text(totals.fat);
    $('#food-log-table #totals-carbs').text(totals.carbs);
    $('#food-log-table #totals-protein').text(totals.protein);
}

function addFoodAmounts() {
    
    const validationErrors = [];
    // Get foods entered
    const enteredFoodamounts = [];
    for (let ele of $('.selected-food-amount')) {
        // Clear any validation errors
        $(ele.parentElement).removeClass('error');

        let foodAmount = parseFloat(ele.value)
        if (isNaN(foodAmount)) {
            validationErrors.push({element: ele, message: 'Invalid amount'});
        } else if (foodAmount <= 0) {
            validationErrors.push({ element: ele, message: 'Amount must be greater than zero' });
        }
        enteredFoodamounts.push({ foodId: parseInt($(ele).data('food-id')), amount: foodAmount });
    }

    console.log(validationErrors);
    let animationStaggerStep = 0;
    if (validationErrors.length > 0) {
        // Display errors
        for (let error of validationErrors) {
            $(error.element.parentElement).addClass('error');
            $(error.element.parentElement).popup({
                hoverable: true,
                content: error.message,
                title: 'Error',
                position: 'right center',
            });
            $(error.element.parentElement).transition({
                animation: 'bounce',
                duration: 400 + animationStaggerStep,
            });
            animationStaggerStep += 150;
        }
        return false;
    }

    // Save food to foodlog
    appendFoodLogs(app.profile.id, dateToString(app.currentDate), enteredFoodamounts);

    // Update food log table
    updateFoodLogTable(app.profile.id, dateToString(app.currentDate));

    // Clear selected foods
    $('#food').dropdown('clear')
}

function addFoods() {
    // Open modal
    $('#add-food-log-modal')
        .modal({
            centered: false,
            duration: 200,
            onDeny: function () {

            },
            onApprove: addFoodAmounts,
        })
        .modal('show');

    // Get foods selected
    const selectedValues = $('#food').dropdown('get value').split(',').map(v => parseInt(v));
    const selectedFoods = foods.filter(f => selectedValues.includes(f.value));  // This loses selection order
    let html = '';
    for (let f of selectedFoods) {
        html += `<tr>
                        <td>${f.name}</td>
                        <td class="collapsing"><div class="ui mini right labeled input"><input  style="width: 80px;" class="selected-food-amount" data-food-id="${f.value}" type="number" min=0 /><div class="ui basic label">${f.units}</div></div></td>
                        <td class="right aligned"><div id="food-${f.value}-calories"></div></td>
                        <td class="right aligned"><div id="food-${f.value}-fat"></div></td>
                        <td class="right aligned"><div id="food-${f.value}-carbs"></div></td>
                        <td class="right aligned"><div id="food-${f.value}-protein"></div></td>
                </tr>`
    }
    $('#selected-foods-table > tbody').html(html);
    $('#selected-foods-table input.selected-food-amount').on('input', function (e) {
        const amount = this.value;
        const food = selectedFoods.filter(f => f.value === parseInt($(this).data('food-id')))[0];
        const calculatedFoodAmounts = {
            calories: '',
            fat: '',
            carbs: '',
            protein: '',
        };
        if (amount !== '' && amount !== null && amount !== undefined && amount > 0) {
            calculatedFoodAmounts.calories = amount  * food.calories / food.servingSize;
            calculatedFoodAmounts.fat = amount * food.fat / food.servingSize;
            calculatedFoodAmounts.carbs = amount * food.carbs / food.servingSize;
            calculatedFoodAmounts.protein = amount * food.protein / food.servingSize;
        }
        $('#food-' + food.value + '-calories').text(calculatedFoodAmounts.calories);
        $('#food-' + food.value + '-fat').text(calculatedFoodAmounts.fat);
        $('#food-' + food.value + '-carbs').text(calculatedFoodAmounts.carbs);
        $('#food-' + food.value + '-protein').text(calculatedFoodAmounts.protein);
    });
}

function goToDate(date) {
    loadPage('food-log');
    if (date !== undefined) {
        $('#enter-date-input').val(date);
    }
    const enteredDate = $('#enter-date-input').val();
    if (enteredDate === '') {
        return false;
    }
    app.currentDate = new Date(enteredDate);
    $('#food-log-date-label').transition({
        animation: 'zoom',
        duration: 100,
        onComplete: function () {
            $('#food-log-date-label').text(dateToNiceString(app.currentDate));
            $('#food-log-date-label').transition({
                animation: 'zoom',
                duration: 150,
            });
        }
    });
    
    updateFoodLogTable(app.profile.id, dateToString(app.currentDate));

    localStorage.setItem('app_lastDate', dateToString(app.currentDate));
}