<template>
  <!-- Modal Overlay -->
  <div @click="$emit('cancel')" class="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
    <!-- Modal Content -->
    <div @click.stop class="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl relative">
      <!-- Close Button -->
      <button
        @click="$emit('cancel')"
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      >
        ✖
      </button>

      <h2 class="text-xl font-bold mb-4">
        {{ member ? "Edit Member" : "Add New Member" }}
      </h2>

      <form @submit.prevent="saveMember" class="grid grid-cols-2 gap-6">
        <!-- Left Column -->
        <div class="space-y-4">
          <!-- Firstname -->
          <div>
            <label class="block text-gray-700 font-medium">First Name</label>
            <input v-model="form.firstname" type="text"
                   class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" required />
          </div>

          <!-- Middle Name -->
          <div>
            <label class="block text-gray-700 font-medium">Middle Name</label>
            <input v-model="form.middlename" type="text"
                   class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" />
          </div>

          <!-- Last Name -->
          <div>
            <label class="block text-gray-700 font-medium">Last Name</label>
            <input v-model="form.lastname" type="text"
                   class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" required />
          </div>

          <!-- Birthdate -->
          <div>
            <label class="block text-gray-700 font-medium">Birthdate</label>
            <input v-model="form.birthdate" type="date"
                   class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" required />
          </div>
        </div>

        <!-- Right Column -->
        <div class="space-y-4">
          <!-- Gender -->
          <div>
            <label class="block text-gray-700 font-medium">Gender</label>
            <select v-model="form.gender" class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" required>
              <option value="">-- Select Gender --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <!-- Photo -->
          <div>
            <label class="block text-gray-700 font-medium">Photo</label>
            <input @change="handlePhotoUpload" type="file" accept="image/*"
                   class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            <img :src="form.photo || '/photos/default.jpg'" alt="preview" class="mt-2 w-16 h-16 rounded-full" />
          </div>

          <!-- Parent -->
          <div>
            <label class="block text-gray-700 font-medium">Parent</label>
            <select v-model="form.parent" class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500">
              <option value="">-- No Parent --</option>
              <option v-for="m in availableParents" :key="m.id" :value="m.id">
                {{ m.lastname }}, {{ m.firstname }} {{ m.middlename }}
              </option>
            </select>
          </div>

          <!-- Remarks -->
          <div>
            <label class="block text-gray-700 font-medium">Remarks</label>
            <textarea v-model="form.remarks"
                      class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
        </div>

        <!-- Spouse Section (Expandable) -->
        <div class="col-span-2 border-t pt-4">
          <button type="button" @click="showSpouse = !showSpouse" 
                  class="flex items-center text-blue-600 hover:text-blue-800 font-medium">
            <span :class="showSpouse ? 'rotate-90' : ''" class="transform transition-transform mr-2">▶</span>
            Spouse Information (Optional)
          </button>
          
          <div v-if="showSpouse" class="grid grid-cols-2 gap-6 mt-4">
            <!-- Spouse Name -->
            <div>
              <label class="block text-gray-700 font-medium">Spouse Name</label>
              <input v-model="form.spousename" type="text"
                     class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" />
            </div>

            <!-- Spouse Photo -->
            <div>
              <label class="block text-gray-700 font-medium">Spouse Photo</label>
              <input @change="handleSpousePhotoUpload" type="file" accept="image/*"
                     class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500" />
              <img :src="form.spousephoto || '/photos/default.jpg'" alt="spouse preview" class="mt-2 w-16 h-16 rounded-full" />
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="col-span-2 flex justify-end space-x-3 mt-6">
          <button type="button" @click="$emit('cancel')"
                  class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
            Cancel
          </button>
          <button type="submit"
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: "MemberComponent",
  props: {
    member: { type: Object, default: null }, // if editing, pass member object
    members: { type: Array, required: true } // all members for parent dropdown
  },
  data() {
    return {
      form: this.member ? { ...this.member } : {
        id: Date.now().toString(), // simple unique ID
        firstname: "",
        middlename: "",
        lastname: "",
        birthdate: "",
        gender: "",
        photo: "/photos/default.jpg",
        remarks: "",
        parent: null,
        spousename: "",
        spousephoto: "/photos/default.jpg"
      },
      showSpouse: false
    };
  },
  computed: {
    availableParents() {
      return this.members.filter(m => m.id !== this.form.id);
    }
  },
  methods: {
    handlePhotoUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.form.photo = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    handleSpousePhotoUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.form.spousephoto = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    },
    saveMember() {
      this.$emit("save", this.form);
    }
  }
};
</script>