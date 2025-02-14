<template>
  <div class="monthly-details">
    <!-- ...existing code... -->
    <div class="tasks-progress">
      {{ completedTasks }} out of {{ totalTasks }} tests completed.
    </div>
    <div class="tasks-list">
      <div v-for="(task, index) in tasks" :key="index">
        <input 
          type="checkbox" 
          v-model="task.completed" 
          @change="handleCheckboxChange" />
        <span>{{ task.name }}</span>
      </div>
    </div>
    <!-- ...existing code... -->
  </div>
</template>

<script>
export default {
  name: 'MonthlyDetails',
  data() {
    return {
      tasks: [
        // Example tasks. Replace or load these as necessary.
        { name: 'Test #1', completed: false },
        { name: 'Test #2', completed: false }
      ]
      // ...existing code...
    };
  },
  computed: {
    totalTasks() {
      return this.tasks.length;
    },
    completedTasks() {
      return this.tasks.filter(task => task.completed).length;
    }
  },
  methods: {
    handleCheckboxChange() {
      // This method can be used to perform additional actions whenever a checkbox state changes.
      // ...existing code...
    }
    // ...existing code...
  }
}
</script>

<style scoped>
  /* ...existing code... */
  .tasks-progress {
    font-weight: bold;
    margin-bottom: 1rem;
  }
</style>
