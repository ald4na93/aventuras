const taskInput = document.getElementById('task-input');
const addTaskButton = document.getElementById('add-task-button');
const taskList = document.getElementById('task-list');
const errorMessage = document.getElementById('error-message');
const completedTasksList = document.getElementById('completed-tasks-list');

// **REEMPLAZA CON TUS CLAVES DE SUPABASE**
const supabaseUrl = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcWNiZXFhY2JvYnR3dHp3aXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMzM5NjEsImV4cCI6MjA1OTkwOTk2MX0.lf_0WxVYjrcjdkbgGPeHZl8cmFej1dWlNH8oekn2Luo';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplcWNiZXFhY2JvYnR3dHp3aXp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDMzMzk2MSwiZXhwIjoyMDU5OTA5OTYxfQ.rMVtglgPpC-iUrqpqZ0kHRs5SzkDp8fVJQUAoZBT3dk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const heartEmojis = ['❤️', '🧡', '💛', '💚', '💙', '💜'];
const plantEmojis = ['🌱', '🌿', '☘️', '🌵', '🌴'];
const foodEmojis = ['🍕', '🍔', '🍣', '🥗', '🍝'];
const movieEmojis = ['🎬', '🎥', '🍿', '🎞️', '📽️'];
const sleepEmojis = ['😴', '💤', '🛌', '🌙', '🌚'];
const cameraEmojis = ['📸', '📹', '🎥', '🎞️', '📽️'];

let audio;
let isPlaying = false;

function getFormattedDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function addTaskToCloud(taskText) {
    const { data, error } = await supabase
        .from('tasks')
        .insert([{ text: taskText }]);

    if (error) {
        console.error('Error al agregar tarea:', error);
    } else {
        console.log('Tarea agregada:', data);
        loadTasksFromCloud(); // Recargar la lista de tareas
    }
}

async function loadTasksFromCloud() {
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .order('createdAt');

    if (error) {
        console.error('Error al cargar tareas:', error);
    } else {
        taskList.innerHTML = '';
        completedTasksList.innerHTML = '<h2>Misiones Completadas</h2><ul></ul>';
        tasks.forEach(task => {
            const listItem = createTaskListItem(task);
            if (task.completedAt) {
                listItem.classList.add('completed');
                completedTasksList.querySelector('ul').appendChild(listItem);
            } else {
                taskList.appendChild(listItem);
            }
        });
    }
}

async function completeTaskInCloud(taskId) {
    const { data, error } = await supabase
        .from('tasks')
        .update({ completedAt: getFormattedDate() })
        .eq('id', taskId);

    if (error) {
        console.error('Error al completar tarea:', error);
    } else {
        console.log('Tarea completada:', data);
        loadTasksFromCloud(); // Recargar la lista de tareas
    }
}

async function undoCompleteTaskInCloud(taskId) {
    const { data, error } = await supabase
        .from('tasks')
        .update({ completedAt: null })
        .eq('id', taskId);

    if (error) {
        console.error('Error al deshacer completar tarea:', error);
    } else {
        console.log('Tarea des-completada:', data);
        loadTasksFromCloud(); // Recargar la lista de tareas
    }
}

async function deleteTaskFromCloud(taskId) {
    const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

    if (error) {
        console.error('Error al eliminar tarea:', error);
    } else {
        console.log('Tarea eliminada:', data);
        loadTasksFromCloud(); // Recargar la lista de tareas
    }
}

function createTaskListItem(task) {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
        <span>${task.text}</span>
        <span class="created-at">Creado: ${new Date(task.createdAt).toLocaleString()}</span>
        ${task.completedAt ? `<span class="completed-at">Completado: ${new Date(task.completedAt).toLocaleString()}</span>` : ''}
    `;

    const completeButton = document.createElement('button');
    completeButton.textContent = task.completedAt ? 'Deshacer' : 'Completar';
    completeButton.style.backgroundColor = '#6ee7b7';
    completeButton.addEventListener('click', () => {
        const taskId = task.id;
        if (listItem.classList.contains('completed')) {
            listItem.classList.remove('completed');
            completeButton.textContent = 'Completar';
            undoCompleteTaskInCloud(taskId);
        } else {
            listItem.classList.add('completed');
            completeButton.textContent = 'Deshacer';
            completeTaskInCloud(taskId);
        }
    });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Eliminar';
    deleteButton.classList.add('delete-button');
    deleteButton.style.backgroundColor = '#f87171';
    deleteButton.addEventListener('click', () => {
        const taskId = task.id;
        deleteTaskFromCloud(taskId);
    });

    listItem.appendChild(completeButton);
    listItem.appendChild(deleteButton);

    return listItem;
}

addTaskButton.addEventListener('click', () => {
    const taskText = taskInput.value.trim();
    if (taskText) {
        addTaskToCloud(taskText);
        taskInput.value = '';
        errorMessage.style.display = 'none';
    } else {
        errorMessage.style.display = 'block';
    }
});

// Cargar las tareas al iniciar la página
window.addEventListener('load', loadTasksFromCloud);
