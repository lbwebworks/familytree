<template>
  <!-- Modal Overlay -->
  <div @click="$emit('cancel')" class="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
    <!-- Modal Content -->
    <div @click.stop class="bg-white dark:bg-gray-800 dark:text-gray-100 shadow-lg rounded-lg p-6 w-full max-w-4xl relative">
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
                   class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" required />
          </div>

          <!-- Middle Name -->
          <div>
            <label class="block text-gray-700 font-medium">Middle Name</label>
            <input v-model="form.middlename" type="text"
                   class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
          </div>

          <!-- Last Name -->
          <div>
            <label class="block text-gray-700 font-medium">Last Name</label>
            <input v-model="form.lastname" type="text"
                   class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" required />
          </div>

          <!-- Nickname -->
          <div>
            <label class="block text-gray-700 font-medium">Nickname</label>
            <input v-model="form.nickname" type="text"
                   class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
          </div>

          <!-- Birthdate -->
          <div>
            <label class="block text-gray-700 font-medium">Birthdate</label>
            <input v-model="form.birthdate" type="date"
                   class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" required />
          </div>
        </div>

        <!-- Right Column -->
        <div class="space-y-4">
          <!-- Gender -->
          <div>
            <label class="block text-gray-700 font-medium">Gender</label>
            <select v-model="form.gender" class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" required>
              <option value="">-- Select Gender --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <!-- Photo -->
          <div>
            <label class="block text-gray-700 font-medium">Photo</label>
            <div class="flex items-center space-x-3">
              <input @change="handlePhotoUpload" type="file" accept="image/*" ref="photoInput"
                     class="hidden" />
              <button type="button" @click="$refs.photoInput.click()"
                      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm">
                Choose File
              </button>
              <button type="button" @click="removePhoto" v-if="form.photo && form.photo !== './photos/default.jpg'"
                      class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm">
                Remove
              </button>
              <img :src="form.photo || './photos/default.jpg'" alt="preview" class="w-16 h-16 rounded-full border-2 border-gray-200" />
            </div>
          </div>

          <!-- Parent -->
          <div>
            <label class="block text-gray-700 font-medium">Parent</label>
            <select v-model="form.parent" class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
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
                      class="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"></textarea>
          </div>
        </div>

        <!-- Spouse Section (Expandable) -->
        <div class="col-span-2 border-t dark:border-gray-600 pt-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-700 dark:text-gray-300">Partnerships</h3>
            <button type="button" @click="addUnion"
                    class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
              + Add Partnership
            </button>
          </div>

          <div v-if="formUnions.length === 0" class="text-sm text-gray-400 dark:text-gray-500 italic">
            No partnerships yet. Click "Add Partnership" to add one.
          </div>

          <div v-for="(union, idx) in formUnions" :key="union.id"
               class="mb-4 p-4 border rounded-lg dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40">
            <div class="flex items-center justify-between mb-3">
              <span class="font-medium text-sm text-gray-700 dark:text-gray-300">Partnership {{ idx + 1 }}</span>
              <button type="button" @click="removeUnion(idx)"
                      class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs">Remove</button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Partner First Name</label>
                <input v-model="union.partnerB.firstname" type="text"
                       class="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Partner Middle Name</label>
                <input v-model="union.partnerB.middlename" type="text"
                       class="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Partner Last Name</label>
                <input v-model="union.partnerB.lastname" type="text"
                       class="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Partner Nickname</label>
                <input v-model="union.partnerB.nickname" type="text"
                       class="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Partner Gender</label>
                <select v-model="union.partnerB.gender"
                        class="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                  <option value="">-- Select --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Partner Photo</label>
                <div class="flex items-center gap-2 mt-1">
                  <input @change="handlePartnerPhotoUpload($event, idx)" type="file" accept="image/*"
                         :ref="'partnerPhotoInput-' + idx" class="hidden" />
                  <button type="button" @click="$refs['partnerPhotoInput-' + idx][0].click()"
                          class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">Choose</button>
                  <button type="button" @click="removePartnerPhoto(idx)" v-if="union.partnerB.photo"
                          class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs">Remove</button>
                  <img :src="union.partnerB.photo || './photos/default.jpg'" alt="partner" class="w-10 h-10 rounded-full border-2 border-gray-200 object-cover" />
                </div>
              </div>
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

    <!-- Crop Modal -->
    <div v-if="showCropModal" @click="cancelCrop" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div @click.stop class="bg-white dark:bg-gray-800 rounded-lg p-6 w-[90vw] h-[90vh] mx-4 flex flex-col">
        <h3 class="text-lg font-bold mb-4">Crop Photo</h3>
        <div class="flex-1 flex items-center justify-center mb-4">
          <div class="relative inline-block overflow-hidden">
            <img :src="cropImage" @load="initCrop" ref="cropImg" 
                 class="select-none max-w-full max-h-full" 
                 style="max-width: 80vw; max-height: 70vh;" />
            <!-- Dark overlay with crop hole -->
            <div class="absolute inset-0 pointer-events-none" :style="{
              background: `
                linear-gradient(transparent, transparent),
                radial-gradient(circle at ${cropBox.x + cropBox.size/2}px ${cropBox.y + cropBox.size/2}px, 
                  transparent ${cropBox.size/2}px, 
                  rgba(0,0,0,0.6) ${cropBox.size/2 + 1}px)
              `
            }"></div>
            <!-- Crop box borders only -->
            <div class="absolute border-2 border-white cursor-move" 
                 @mousedown="startDrag"
                 @wheel="handleResize"
                 :style="cropBoxStyle">
            </div>
          </div>
        </div>
        <!-- Size controls -->
        <div class="flex items-center justify-center space-x-2 mb-4">
          <button @click="resizeCrop(-10)" class="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm">-</button>
          <span class="text-sm">{{ Math.round((cropBox.size / Math.min(imageWidth, imageHeight)) * 100) }}%</span>
          <button @click="resizeCrop(10)" class="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm">+</button>
        </div>
        <canvas ref="cropCanvas" class="hidden"></canvas>
        <div class="flex justify-end space-x-3">
          <button @click="cancelCrop" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
            Cancel
          </button>
          <button @click="cropPhoto" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            Save Photo
          </button>
        </div>
      </div>
    </div>

    <!-- Save Prompt Modal -->
    <div v-if="showSavePrompt" @click="showSavePrompt = false" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70">
      <div @click.stop class="bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 class="text-lg font-bold mb-4">Save Cropped Image</h3>
        <p class="text-sm text-gray-600 mb-4">The image will be downloaded to your Downloads folder. Please move it to:</p>
        <code class="bg-gray-100 p-2 rounded block text-sm mb-4">public/photos/</code>
        <div class="flex justify-end space-x-3">
          <button @click="showSavePrompt = false" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
            Cancel
          </button>
          <button @click="saveImageToPhotos" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            Download
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "MemberComponent",
  props: {
    member: { type: Object, default: null }, // if editing, pass member object
    members: { type: Array, required: true }, // all members for parent dropdown
    unions: { type: Array, default: () => [] }, // all unions
  },
  data() {
    return {
      form: this.member ? { 
        ...this.member,
      } : {
        id: Date.now().toString(), // simple unique ID
        firstname: "",
        middlename: "",
        lastname: "",
        nickname: "",
        birthdate: "",
        gender: "",
        photo: "",
        remarks: "",
        parent: null,
      },
      formUnions: (() => {
        const memberId = this.member?.id
        if (!memberId) return []
        const existing = this.unions
          .filter((u) => u.partnerAId === memberId)
          .map((u) => ({ ...u, partnerB: u.partnerB ? { ...u.partnerB } : { firstname: '', middlename: '', lastname: '', nickname: '', photo: '', gender: '' } }))
        if (existing.length === 0 && this.member) {
          const m = this.member
          if (m.spousefirstname || m.spouselastname) {
            existing.push({ id: `u_${m.id}`, partnerAId: m.id, partnerB: { firstname: m.spousefirstname || '', middlename: m.spousemiddlename || '', lastname: m.spouselastname || '', nickname: m.spousenickname || '', photo: m.spousephoto || '', gender: m.gender === 'Male' ? 'Female' : 'Male' } })
          }
        }
        return existing
      })(),
      cropTargetUnionIdx: 0,
      showCropModal: false,
      cropImage: null,
      cropType: 'photo', // 'photo' or 'partner'
      cropBox: { x: 0, y: 0, size: 100 },
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      imageWidth: 0,
      imageHeight: 0,
      croppedImage: null,
      showSavePrompt: false
    };
  },
  computed: {
    availableParents() {
      return this.members.filter(m => m.id !== this.form.id);
    },
    cropBoxStyle() {
      return {
        left: this.cropBox.x + 'px',
        top: this.cropBox.y + 'px',
        width: this.cropBox.size + 'px',
        height: this.cropBox.size + 'px'
      };
    },
  },
  methods: {
    addUnion() {
      this.formUnions.push({ id: `u_${this.form.id}_${Date.now()}`, partnerAId: this.form.id, partnerB: { firstname: '', middlename: '', lastname: '', nickname: '', photo: '', gender: '' } })
    },
    removeUnion(index) {
      this.formUnions.splice(index, 1)
    },
    handlePhotoUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.cropImage = e.target.result;
          this.cropType = 'photo';
          this.showCropModal = true;
        };
        reader.readAsDataURL(file);
      }
    },
    handlePartnerPhotoUpload(event, unionIdx) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.cropImage = e.target.result;
          this.cropType = 'partner';
          this.cropTargetUnionIdx = unionIdx;
          this.showCropModal = true;
        };
        reader.readAsDataURL(file);
      }
    },
    cropPhoto() {
      const img = this.$refs.cropImg;
      const canvas = this.$refs.cropCanvas;
      const ctx = canvas.getContext('2d');
      
      // Get displayed image dimensions
      const imgRect = img.getBoundingClientRect();
      
      // Calculate scale from displayed to natural image
      const scaleX = img.naturalWidth / imgRect.width;
      const scaleY = img.naturalHeight / imgRect.height;
      
      // Calculate crop area in natural image coordinates
      const cropX = this.cropBox.x * scaleX;
      const cropY = this.cropBox.y * scaleY;
      const cropSize = this.cropBox.size * scaleX;
      
      // Set canvas to actual crop size to maintain quality
      canvas.width = cropSize;
      canvas.height = cropSize;
      
      // Draw the cropped area to canvas at full resolution
      ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);
      
      // Store cropped image data and show save prompt (high quality JPEG)
      this.croppedImage = {
        dataUrl: canvas.toDataURL('image/jpeg', 0.95),
        filename: `photo_${Date.now()}.jpg`
      };
      
      this.showSavePrompt = true;
    },
    saveImageToPhotos() {
      if (!this.croppedImage) return;
      
      // Convert data URL to blob
      const byteString = atob(this.croppedImage.dataUrl.split(',')[1]);
      const mimeString = this.croppedImage.dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      
      // Create download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = this.croppedImage.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      // Update form with photo path
      const photoPath = `./photos/${this.croppedImage.filename}`;
      if (this.cropType === 'photo') {
        this.form.photo = photoPath;
      } else if (this.cropType === 'partner') {
        const u = this.formUnions[this.cropTargetUnionIdx]
        if (u && u.partnerB) u.partnerB.photo = photoPath
      }
      
      this.showSavePrompt = false;
      this.showCropModal = false;
    },
    cancelCrop() {
      this.showCropModal = false;
      this.cropImage = null;
      this.croppedImage = null;
      this.showSavePrompt = false;
      this.stopDrag();
    },
    initCrop() {
      this.$nextTick(() => {
        const img = this.$refs.cropImg;
        if (img) {
          const imgRect = img.getBoundingClientRect();
          this.imageWidth = imgRect.width;
          this.imageHeight = imgRect.height;
          // Square crop size is 100% of the shorter dimension
          const size = Math.min(imgRect.width, imgRect.height);
          this.cropBox = {
            x: (imgRect.width - size) / 2,
            y: (imgRect.height - size) / 2,
            size: size
          };
        }
      });
    },
    startDrag(event) {
      this.isDragging = true;
      this.dragStart = {
        x: event.clientX - this.cropBox.x,
        y: event.clientY - this.cropBox.y
      };
      document.addEventListener('mousemove', this.drag);
      document.addEventListener('mouseup', this.stopDrag);
      event.preventDefault();
    },
    drag(event) {
      if (this.isDragging) {
        const img = this.$refs.cropImg;
        const imgRect = img.getBoundingClientRect();
        
        // Calculate new position
        let newX = event.clientX - this.dragStart.x;
        let newY = event.clientY - this.dragStart.y;
        
        // Constrain to image bounds
        newX = Math.max(0, Math.min(newX, imgRect.width - this.cropBox.size));
        newY = Math.max(0, Math.min(newY, imgRect.height - this.cropBox.size));
        
        this.cropBox.x = newX;
        this.cropBox.y = newY;
      }
    },
    stopDrag() {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.drag);
      document.removeEventListener('mouseup', this.stopDrag);
    },
    handleResize(event) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -5 : 5;
      this.resizeCrop(delta);
    },
    resizeCrop(delta) {
      let newSize = this.cropBox.size + delta;
      
      // Minimum size constraint
      newSize = Math.max(30, newSize);
      
      // Maximum size constraints based on position and image bounds
      const maxSizeFromRight = this.imageWidth - this.cropBox.x;
      const maxSizeFromBottom = this.imageHeight - this.cropBox.y;
      newSize = Math.min(newSize, maxSizeFromRight, maxSizeFromBottom);
      
      // Adjust position if crop box would go out of bounds
      let newX = this.cropBox.x;
      let newY = this.cropBox.y;
      
      if (newX + newSize > this.imageWidth) {
        newX = this.imageWidth - newSize;
      }
      if (newY + newSize > this.imageHeight) {
        newY = this.imageHeight - newSize;
      }
      
      this.cropBox.size = newSize;
      this.cropBox.x = Math.max(0, newX);
      this.cropBox.y = Math.max(0, newY);
    },
    removePartnerPhoto(unionIdx) {
      const u = this.formUnions[unionIdx]
      if (u && u.partnerB) u.partnerB.photo = ''
    },
    removePhoto() {
      this.form.photo = "";
    },
    saveMember() {
      this.$emit("save", { member: this.form, unions: this.formUnions.map((u) => ({ ...u, partnerAId: this.form.id })) });
    }
  }
};
</script>