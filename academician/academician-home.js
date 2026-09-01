// =====================================================
// SKILLBRIDGE ACADEMICIAN DASHBOARD
// Firebase + Firestore + Cloudinary
// =====================================================


// =====================================================
// FIREBASE
// =====================================================

import {
    initializeApp
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";


import {
    getAuth,
    onAuthStateChanged,
    signOut,
    updateProfile
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyDKCs2W0KEcsPTiwdw1eHLdtq5zJQi4cmI",

    authDomain:
        "ansora-27fe4.firebaseapp.com",

    projectId:
        "ansora-27fe4",

    storageBucket:
        "ansora-27fe4.firebasestorage.app",

    messagingSenderId:
        "230795678686",

    appId:
        "1:230795678686:web:06f0ccd7b8717ac13ac34f"

};


// Initialize Firebase

const app =
    initializeApp(firebaseConfig);


// Firebase Authentication

const auth =
    getAuth(app);


// Firestore

const db =
    getFirestore(app);


// =====================================================
// CLOUDINARY
// =====================================================

const CLOUDINARY_CLOUD_NAME =
    "dvrzhdeas";


const CLOUDINARY_UPLOAD_PRESET =
    "skillbridge_profile";


// =====================================================
// CURRENT USER
// =====================================================

let currentUser = null;

let currentUserData = {};

let currentAcademicianData = {};


// =====================================================
// GET ELEMENTS
// =====================================================


// Welcome

const welcomeName =
    document.getElementById(
        "welcomeName"
    );

const currentDate =
    document.getElementById(
        "currentDate"
    );


// Top profile

const topName =
    document.getElementById(
        "topName"
    );

const topInitial =
    document.getElementById(
        "topInitial"
    );

const topProfileImage =
    document.getElementById(
        "topProfileImage"
    );


// Main profile

const profileName =
    document.getElementById(
        "profileName"
    );

const profileEmail =
    document.getElementById(
        "profileEmail"
    );

const profileInitial =
    document.getElementById(
        "profileInitial"
    );

const profileImage =
    document.getElementById(
        "profileImage"
    );


// Profile details

const institutionValue =
    document.getElementById(
        "institutionValue"
    );

const departmentValue =
    document.getElementById(
        "departmentValue"
    );

const designationValue =
    document.getElementById(
        "designationValue"
    );

const qualificationValue =
    document.getElementById(
        "qualificationValue"
    );

const experienceValue =
    document.getElementById(
        "experienceValue"
    );

const specializationValue =
    document.getElementById(
        "specializationValue"
    );

const locationValue =
    document.getElementById(
        "locationValue"
    );


// Completion

const completionInitial =
    document.getElementById(
        "completionInitial"
    );

const completionAvatar =
    document.getElementById(
        "completionAvatar"
    );

const completionPercent =
    document.getElementById(
        "completionPercent"
    );

const profileProgress =
    document.getElementById(
        "profileProgress"
    );

const profileScore =
    document.getElementById(
        "profileScore"
    );


// Statistics

const studentsCount =
    document.getElementById(
        "studentsCount"
    );

const opportunitiesCount =
    document.getElementById(
        "opportunitiesCount"
    );

const researchCount =
    document.getElementById(
        "researchCount"
    );


// Research statistics

const researchProjects =
    document.getElementById(
        "researchProjects"
    );

const researchPartners =
    document.getElementById(
        "researchPartners"
    );

const researchStudents =
    document.getElementById(
        "researchStudents"
    );


// Profile image

const profilePhotoInput =
    document.getElementById(
        "profilePhotoInput"
    );


// Logout

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


// Mobile menu

const menuButton =
    document.getElementById(
        "menuButton"
    );

const sidebar =
    document.getElementById(
        "sidebar"
    );


// =====================================================
// MODAL
// =====================================================

const profileModal =
    document.getElementById(
        "profileModal"
    );

const editProfileButton =
    document.getElementById(
        "editProfileButton"
    );

const completeProfileButton =
    document.getElementById(
        "completeProfileBtn"
    );

const closeModal =
    document.getElementById(
        "closeModal"
    );

const cancelModal =
    document.getElementById(
        "cancelModal"
    );

const profileForm =
    document.getElementById(
        "profileForm"
    );

const profileSaveMessage =
    document.getElementById(
        "profileSaveMessage"
    );

const saveProfileButton =
    document.getElementById(
        "saveProfileButton"
    );


// Modal fields

const editName =
    document.getElementById(
        "editName"
    );

const editEmail =
    document.getElementById(
        "editEmail"
    );

const editInstitution =
    document.getElementById(
        "editInstitution"
    );

const editDepartment =
    document.getElementById(
        "editDepartment"
    );

const editDesignation =
    document.getElementById(
        "editDesignation"
    );

const editQualification =
    document.getElementById(
        "editQualification"
    );

const editExperience =
    document.getElementById(
        "editExperience"
    );

const editSpecialization =
    document.getElementById(
        "editSpecialization"
    );

const editLocation =
    document.getElementById(
        "editLocation"
    );

const editBio =
    document.getElementById(
        "editBio"
    );


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        // ---------------------------------------------
        // USER NOT LOGGED IN
        // ---------------------------------------------

        if (!user) {

            window.location.href =
                "../login.html";

            return;

        }


        currentUser =
            user;


        try {

            await loadAcademicianData(
                user
            );

        }

        catch (error) {

            console.error(
                "Dashboard loading error:",
                error
            );

        }

    }
);


// =====================================================
// LOAD ACADEMICIAN DATA
// =====================================================

async function loadAcademicianData(
    user
) {

    // =================================================
    // LOAD COMMON USER DATA
    // =================================================

    const userRef =
        doc(
            db,
            "users",
            user.uid
        );


    const userSnapshot =
        await getDoc(
            userRef
        );


    if (
        userSnapshot.exists()
    ) {

        currentUserData =
            userSnapshot.data();

    }

    else {

        currentUserData = {

            name:
                user.displayName ||
                "Academician",

            email:
                user.email ||
                "",

            role:
                "academician",

            photoURL:
                "",

            createdAt:
                serverTimestamp()

        };


        await setDoc(
            userRef,
            currentUserData
        );

    }


    // =================================================
    // ROLE CHECK
    // =================================================

    if (
        currentUserData.role &&
        currentUserData.role !==
        "academician"
    ) {

        redirectByRole(
            currentUserData.role
        );

        return;

    }


    // =================================================
    // LOAD ACADEMICIAN-SPECIFIC DATA
    // =================================================

    const academicianRef =
        doc(
            db,
            "academicians",
            user.uid
        );


    const academicianSnapshot =
        await getDoc(
            academicianRef
        );


    if (
        academicianSnapshot.exists()
    ) {

        currentAcademicianData =
            academicianSnapshot.data();

    }

    else {

        currentAcademicianData = {

            institution:
                "",

            department:
                "",

            designation:
                "",

            qualification:
                "",

            experience:
                "",

            specialization:
                "",

            location:
                "",

            bio:
                "",

            skills:
                [],

            researchProjects:
                0,

            researchPartners:
                0,

            researchStudents:
                0,

            studentsMentored:
                0,

            createdAt:
                serverTimestamp()

        };


        await setDoc(
            academicianRef,
            currentAcademicianData
        );

    }


    // =================================================
    // UPDATE UI
    // =================================================

    updateDashboard();

}


// =====================================================
// UPDATE DASHBOARD
// =====================================================

function updateDashboard() {

    const name =
        currentUserData.name ||
        currentUser.displayName ||
        "Academician";


    const email =
        currentUserData.email ||
        currentUser.email ||
        "";


    const photoURL =
        currentUserData.photoURL ||
        "";


    const initial =
        getInitial(
            name
        );


    // =================================================
    // NAME
    // =================================================

    welcomeName.textContent =
        firstName(
            name
        );


    topName.textContent =
        name;


    profileName.textContent =
        name;


    // =================================================
    // EMAIL
    // =================================================

    profileEmail.textContent =
        email;


    editEmail.value =
        email;


    // =================================================
    // INITIAL
    // =================================================

    topInitial.textContent =
        initial;


    profileInitial.textContent =
        initial;


    completionInitial.textContent =
        initial;


    // =================================================
    // PROFILE DETAILS
    // =================================================

    institutionValue.textContent =
        currentAcademicianData.institution ||
        "Not added";


    departmentValue.textContent =
        currentAcademicianData.department ||
        "Not added";


    designationValue.textContent =
        currentAcademicianData.designation ||
        "Not added";


    qualificationValue.textContent =
        currentAcademicianData.qualification ||
        "Not added";


    experienceValue.textContent =
        currentAcademicianData.experience
            ? `${currentAcademicianData.experience} years`
            : "Not added";


    specializationValue.textContent =
        currentAcademicianData.specialization ||
        "Not added";


    locationValue.textContent =
        currentAcademicianData.location ||
        "Not added";


    // =================================================
    // FILL EDIT FORM
    // =================================================

    editName.value =
        name;


    editInstitution.value =
        currentAcademicianData.institution ||
        "";


    editDepartment.value =
        currentAcademicianData.department ||
        "";


    editDesignation.value =
        currentAcademicianData.designation ||
        "";


    editQualification.value =
        currentAcademicianData.qualification ||
        "";


    editExperience.value =
        currentAcademicianData.experience ||
        "";


    editSpecialization.value =
        currentAcademicianData.specialization ||
        "";


    editLocation.value =
        currentAcademicianData.location ||
        "";


    editBio.value =
        currentAcademicianData.bio ||
        "";


    // =================================================
    // COMPLETION
    // =================================================

    const completion =
        calculateProfileCompletion();


    completionPercent.textContent =
        `${completion}%`;


    profileScore.textContent =
        `${completion}%`;


    profileProgress.style.width =
        `${completion}%`;


    // =================================================
    // RESEARCH
    // =================================================

    const projects =
        Number(
            currentAcademicianData.researchProjects ||
            0
        );


    const partners =
        Number(
            currentAcademicianData.researchPartners ||
            0
        );


    const researchStudentsValue =
        Number(
            currentAcademicianData.researchStudents ||
            0
        );


    researchProjects.textContent =
        projects;


    researchPartners.textContent =
        partners;


    researchStudents.textContent =
        researchStudentsValue;


    researchCount.textContent =
        projects;


    // =================================================
    // STUDENTS
    // =================================================

    studentsCount.textContent =
        currentAcademicianData.studentsMentored ||
        0;


    // =================================================
    // OPPORTUNITIES
    // =================================================

    opportunitiesCount.textContent =
        currentAcademicianData.opportunityCount ||
        0;


    // =================================================
    // SKILLS
    // =================================================

    renderSkills();


    // =================================================
    // IMAGE
    // =================================================

    if (
        photoURL &&
        photoURL.trim() !== ""
    ) {

        setProfileImage(
            photoURL
        );

    }

    else {

        showProfileInitial(
            initial
        );

    }

}


// =====================================================
// PROFILE COMPLETION
// =====================================================

function calculateProfileCompletion() {

    const values = [

        currentUserData.name,

        currentUserData.email,

        currentUserData.photoURL,

        currentAcademicianData.institution,

        currentAcademicianData.department,

        currentAcademicianData.designation,

        currentAcademicianData.qualification,

        currentAcademicianData.experience,

        currentAcademicianData.specialization,

        currentAcademicianData.location,

        currentAcademicianData.bio

    ];


    const completed =
        values.filter(
            value => {

                return (
                    value !== undefined &&
                    value !== null &&
                    String(value).trim() !== ""
                );

            }
        ).length;


    return Math.round(
        (
            completed /
            values.length
        ) * 100
    );

}


// =====================================================
// RENDER SKILLS
// =====================================================

function renderSkills() {

    const skillsList =
        document.getElementById(
            "skillsList"
        );


    const skills =
        Array.isArray(
            currentAcademicianData.skills
        )
            ? currentAcademicianData.skills
            : [];


    if (
        skills.length === 0
    ) {

        skillsList.innerHTML = `

            <div class="empty-state">

                <div>
                    ✦
                </div>

                <p>
                    No skills added yet.
                </p>

                <span>
                    Add your academic and professional expertise.
                </span>

            </div>

        `;

        return;

    }


    // Limit first 6 skills

    const visibleSkills =
        skills.slice(
            0,
            6
        );


    skillsList.innerHTML =
        visibleSkills.map(
            skill => {

                const skillName =
                    typeof skill === "string"
                        ? skill
                        : skill.name || "Skill";


                const level =
                    typeof skill === "object"
                        ? Number(
                            skill.level || 70
                        )
                        : 70;


                return `

                    <div class="skill-item">

                        <div class="skill-name">

                            <span>
                                ${escapeHTML(skillName)}
                            </span>

                            <small>
                                Academic Expertise
                            </small>

                        </div>


                        <div class="skill-bar">

                            <div
                                class="skill-bar-fill"
                                style="width:${level}%">
                            </div>

                        </div>


                        <strong>
                            ${level}%
                        </strong>

                    </div>

                `;

            }
        ).join("");

}


// =====================================================
// PROFILE PHOTO UPLOAD
// =====================================================

profilePhotoInput.addEventListener(
    "change",
    async () => {

        const file =
            profilePhotoInput.files[0];


        if (!file) {

            return;

        }


        // ---------------------------------------------
        // TYPE VALIDATION
        // ---------------------------------------------

        const allowedTypes = [

            "image/jpeg",

            "image/png",

            "image/webp"

        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            showMessage(
                "Please select a JPG, PNG or WebP image.",
                "error"
            );

            profilePhotoInput.value =
                "";

            return;

        }


        // ---------------------------------------------
        // SIZE VALIDATION
        // ---------------------------------------------

        const maxSize =
            5 * 1024 * 1024;


        if (
            file.size >
            maxSize
        ) {

            showMessage(
                "Image must be smaller than 5 MB.",
                "error"
            );

            profilePhotoInput.value =
                "";

            return;

        }


        // ---------------------------------------------
        // BUTTON
        // ---------------------------------------------

        const photoButton =
            document.querySelector(
                ".photo-button"
            );


        if (photoButton) {

            photoButton.style.pointerEvents =
                "none";

            photoButton.style.opacity =
                "0.5";

        }


        // ---------------------------------------------
        // LOCAL PREVIEW
        // ---------------------------------------------

        const localURL =
            URL.createObjectURL(
                file
            );


        setProfileImage(
            localURL
        );


        try {

            console.log(
                "Uploading academician image to Cloudinary..."
            );


            // -----------------------------------------
            // FORM DATA
            // -----------------------------------------

            const formData =
                new FormData();


            formData.append(
                "file",
                file
            );


            formData.append(
                "upload_preset",
                CLOUDINARY_UPLOAD_PRESET
            );


            // -----------------------------------------
            // CLOUDINARY
            // -----------------------------------------

            const response =
                await fetch(

                    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,

                    {

                        method:
                            "POST",

                        body:
                            formData

                    }

                );


            const cloudinaryData =
                await response.json();


            // -----------------------------------------
            // CHECK
            // -----------------------------------------

            if (
                !response.ok
            ) {

                throw new Error(
                    cloudinaryData
                        ?.error
                        ?.message ||
                    "Cloudinary upload failed."
                );

            }


            const imageURL =
                cloudinaryData.secure_url;


            if (!imageURL) {

                throw new Error(
                    "Cloudinary did not return an image URL."
                );

            }


            console.log(
                "Cloudinary URL:",
                imageURL
            );


            // -----------------------------------------
            // SAVE TO USERS COLLECTION
            // -----------------------------------------

            await updateDoc(

                doc(
                    db,
                    "users",
                    currentUser.uid
                ),

                {

                    photoURL:
                        imageURL,

                    updatedAt:
                        serverTimestamp()

                }

            );


            // -----------------------------------------
            // SAVE LOCAL DATA
            // -----------------------------------------

            currentUserData.photoURL =
                imageURL;


            // -----------------------------------------
            // UPDATE AUTH PROFILE
            // -----------------------------------------

            try {

                await updateProfile(
                    currentUser,
                    {
                        photoURL:
                            imageURL
                    }
                );

            }

            catch (authError) {

                console.warn(
                    "Firebase Auth photo update warning:",
                    authError
                );

            }


            // -----------------------------------------
            // DISPLAY
            // -----------------------------------------

            setProfileImage(
                imageURL
            );


            // -----------------------------------------
            // UPDATE COMPLETION
            // -----------------------------------------

            const completion =
                calculateProfileCompletion();


            completionPercent.textContent =
                `${completion}%`;


            profileScore.textContent =
                `${completion}%`;


            profileProgress.style.width =
                `${completion}%`;


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            showMessage(
                "Profile picture uploaded successfully.",
                "success"
            );

        }


        catch (error) {

            console.error(
                "Cloudinary upload error:",
                error
            );


            // Restore previous photo

            if (
                currentUserData.photoURL
            ) {

                setProfileImage(
                    currentUserData.photoURL
                );

            }

            else {

                showProfileInitial(
                    getInitial(
                        currentUserData.name
                    )
                );

            }


            showMessage(
                error.message ||
                "Unable to upload profile picture.",
                "error"
            );

        }


        finally {

            if (photoButton) {

                photoButton.style.pointerEvents =
                    "auto";

                photoButton.style.opacity =
                    "1";

            }


            profilePhotoInput.value =
                "";


            URL.revokeObjectURL(
                localURL
            );

        }

    }
);


// =====================================================
// SET PROFILE IMAGE
// =====================================================

function setProfileImage(
    imageURL
) {

    // Main profile

    profileImage.innerHTML =
        "";


    const mainImage =
        document.createElement(
            "img"
        );


    mainImage.src =
        imageURL;


    mainImage.alt =
        "Academician profile picture";


    mainImage.onerror =
        () => {

            showProfileInitial(
                getInitial(
                    currentUserData.name
                )
            );

        };


    profileImage.appendChild(
        mainImage
    );


    // Top profile

    topProfileImage.innerHTML =
        "";


    const topImage =
        document.createElement(
            "img"
        );


    topImage.src =
        imageURL;


    topImage.alt =
        "Academician profile picture";


    topImage.onerror =
        () => {

            topProfileImage.innerHTML =
                `
                <span id="topInitial">
                    ${getInitial(currentUserData.name)}
                </span>
                `;

        };


    topProfileImage.appendChild(
        topImage
    );


    // Completion image

    completionAvatar.innerHTML =
        "";


    const completionImage =
        document.createElement(
            "img"
        );


    completionImage.src =
        imageURL;


    completionImage.alt =
        "Academician profile picture";


    completionAvatar.appendChild(
        completionImage
    );

}


// =====================================================
// SHOW INITIAL
// =====================================================

function showProfileInitial(
    initial
) {

    profileImage.innerHTML =
        `
        <span id="profileInitial">
            ${initial}
        </span>
        `;


    topProfileImage.innerHTML =
        `
        <span id="topInitial">
            ${initial}
        </span>
        `;


    completionAvatar.innerHTML =
        `
        <span id="completionInitial">
            ${initial}
        </span>
        `;

}


// =====================================================
// SAVE PROFILE
// =====================================================

profileForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!currentUser) {

            return;

        }


        // ---------------------------------------------
        // VALUES
        // ---------------------------------------------

        const name =
            editName.value.trim();


        const institution =
            editInstitution.value.trim();


        const department =
            editDepartment.value.trim();


        const designation =
            editDesignation.value;


        const qualification =
            editQualification.value.trim();


        const experience =
            editExperience.value;


        const specialization =
            editSpecialization.value.trim();


        const location =
            editLocation.value.trim();


        const bio =
            editBio.value.trim();


        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!name) {

            showFormMessage(
                "Please enter your name.",
                "error"
            );

            return;

        }


        // ---------------------------------------------
        // LOADING
        // ---------------------------------------------

        saveProfileButton.disabled =
            true;


        saveProfileButton.textContent =
            "Saving...";


        try {

            // =========================================
            // UPDATE COMMON USERS DOCUMENT
            // =========================================

            await updateDoc(

                doc(
                    db,
                    "users",
                    currentUser.uid
                ),

                {

                    name:
                        name,

                    updatedAt:
                        serverTimestamp()

                }

            );


            // =========================================
            // UPDATE ACADEMICIAN DOCUMENT
            // =========================================

            await updateDoc(

                doc(
                    db,
                    "academicians",
                    currentUser.uid
                ),

                {

                    institution:
                        institution,

                    department:
                        department,

                    designation:
                        designation,

                    qualification:
                        qualification,

                    experience:
                        experience,

                    specialization:
                        specialization,

                    location:
                        location,

                    bio:
                        bio,

                    updatedAt:
                        serverTimestamp()

                }

            );


            // =========================================
            // UPDATE FIREBASE AUTH DISPLAY NAME
            // =========================================

            try {

                await updateProfile(
                    currentUser,
                    {
                        displayName:
                            name
                    }
                );

            }

            catch (authError) {

                console.warn(
                    "Auth display name update warning:",
                    authError
                );

            }


            // =========================================
            // UPDATE LOCAL OBJECTS
            // =========================================

            currentUserData.name =
                name;


            currentAcademicianData.institution =
                institution;


            currentAcademicianData.department =
                department;


            currentAcademicianData.designation =
                designation;


            currentAcademicianData.qualification =
                qualification;


            currentAcademicianData.experience =
                experience;


            currentAcademicianData.specialization =
                specialization;


            currentAcademicianData.location =
                location;


            currentAcademicianData.bio =
                bio;


            // =========================================
            // UPDATE UI
            // =========================================

            updateDashboard();


            // =========================================
            // SUCCESS
            // =========================================

            showFormMessage(
                "Profile saved successfully.",
                "success"
            );


            setTimeout(
                () => {

                    closeProfileModal();

                },
                800
            );

        }


        catch (error) {

            console.error(
                "Profile save error:",
                error
            );


            showFormMessage(
                error.message ||
                "Unable to save your profile.",
                "error"
            );

        }


        finally {

            saveProfileButton.disabled =
                false;


            saveProfileButton.innerHTML =
                `
                Save Profile
                <span>→</span>
                `;

        }

    }
);


// =====================================================
// OPEN PROFILE MODAL
// =====================================================

editProfileButton.addEventListener(
    "click",
    openProfileModal
);


completeProfileButton.addEventListener(
    "click",
    openProfileModal
);


function openProfileModal() {

    profileSaveMessage.textContent =
        "";


    profileSaveMessage.className =
        "form-message";


    profileModal.classList.add(
        "show"
    );

}


// =====================================================
// CLOSE PROFILE MODAL
// =====================================================

closeModal.addEventListener(
    "click",
    closeProfileModal
);


cancelModal.addEventListener(
    "click",
    closeProfileModal
);


function closeProfileModal() {

    profileModal.classList.remove(
        "show"
    );

}


// =====================================================
// CLICK OUTSIDE MODAL
// =====================================================

profileModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            profileModal
        ) {

            closeProfileModal();

        }

    }
);


// =====================================================
// FORM MESSAGE
// =====================================================

function showFormMessage(
    message,
    type
) {

    profileSaveMessage.textContent =
        message;


    profileSaveMessage.className =
        `form-message ${type}`;

}


// =====================================================
// GENERAL MESSAGE
// =====================================================

function showMessage(
    message,
    type
) {

    let element =
        document.getElementById(
            "dashboardMessage"
        );


    if (!element) {

        element =
            document.createElement(
                "div"
            );


        element.id =
            "dashboardMessage";


        element.style.position =
            "fixed";


        element.style.right =
            "24px";


        element.style.bottom =
            "24px";


        element.style.zIndex =
            "1000";


        element.style.padding =
            "12px 16px";


        element.style.background =
            "white";


        element.style.border =
            "1px solid #E4E4E7";


        element.style.boxShadow =
            "0 10px 30px rgba(0,0,0,.12)";


        element.style.fontSize =
            "10px";


        document.body.appendChild(
            element
        );

    }


    element.textContent =
        message;


    element.style.color =
        type === "success"
            ? "#26734D"
            : "#B42318";


    clearTimeout(
        element._timer
    );


    element._timer =
        setTimeout(
            () => {

                element.remove();

            },
            4000
        );

}


// =====================================================
// LOGOUT
// =====================================================

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(
                auth
            );


            window.location.href =
                "../index.html";

        }

        catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


// =====================================================
// DATE
// =====================================================

if (currentDate) {

    currentDate.textContent =
        new Date().toLocaleDateString(
            "en-IN",
            {
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"

            }
        );

}


// =====================================================
// MOBILE SIDEBAR
// =====================================================

if (
    menuButton &&
    sidebar
) {

    menuButton.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}


// Close mobile navigation

document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    sidebar.classList.remove(
                        "open"
                    );

                }
            );

        }
    );


// =====================================================
// ROLE ROUTER
// =====================================================

function redirectByRole(
    role
) {

    switch (role) {

        case "student":

            window.location.href =
                "../student/student-home.html";

            break;


        case "industry":

            window.location.href =
                "../industry/industry-home.html";

            break;


        case "institution":

            window.location.href =
                "../institution/institution-home.html";

            break;


        default:

            window.location.href =
                "../login.html";

    }

}


// =====================================================
// HELPERS
// =====================================================

function getInitial(
    name
) {

    if (!name) {

        return "A";

    }


    return name
        .trim()
        .charAt(0)
        .toUpperCase();

}


function firstName(
    name
) {

    if (!name) {

        return "Academician";

    }


    return name
        .trim()
        .split(/\s+/)[0];

}


function escapeHTML(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}