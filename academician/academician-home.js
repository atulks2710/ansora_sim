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


// =====================================================
// INITIALIZE FIREBASE
// =====================================================

const app =
    initializeApp(
        firebaseConfig
    );


const auth =
    getAuth(
        app
    );


const db =
    getFirestore(
        app
    );


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

// -----------------------------------------------------
// WELCOME
// -----------------------------------------------------

const welcomeName =
    document.getElementById(
        "welcomeName"
    );


const currentDate =
    document.getElementById(
        "currentDate"
    );


// -----------------------------------------------------
// TOP PROFILE
// -----------------------------------------------------

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


// -----------------------------------------------------
// MAIN PROFILE
// -----------------------------------------------------

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


// -----------------------------------------------------
// PROFILE DETAILS
// -----------------------------------------------------

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


// -----------------------------------------------------
// PROFILE COMPLETION
// -----------------------------------------------------

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


// -----------------------------------------------------
// STATISTICS
// -----------------------------------------------------

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


// -----------------------------------------------------
// RESEARCH STATISTICS
// -----------------------------------------------------

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


// -----------------------------------------------------
// PROFILE PHOTO
// -----------------------------------------------------

const profilePhotoInput =
    document.getElementById(
        "profilePhotoInput"
    );


// -----------------------------------------------------
// LOGOUT
// -----------------------------------------------------

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


// -----------------------------------------------------
// MOBILE MENU
// -----------------------------------------------------

const menuButton =
    document.getElementById(
        "menuButton"
    );


const sidebar =
    document.getElementById(
        "sidebar"
    );


// =====================================================
// PROFILE MODAL
// =====================================================

const profileModal =
    document.getElementById(
        "profileModal"
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


// =====================================================
// PROFILE MODAL FIELDS
// =====================================================

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


            showMessage(
                "Unable to load your dashboard.",
                "error"
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
    // LOAD ACADEMICIAN DATA
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

            opportunityCount:
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
    // UPDATE DASHBOARD
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

    if (welcomeName) {

        welcomeName.textContent =
            firstName(
                name
            );

    }


    if (topName) {

        topName.textContent =
            name;

    }


    if (profileName) {

        profileName.textContent =
            name;

    }


    // =================================================
    // EMAIL
    // =================================================

    if (profileEmail) {

        profileEmail.textContent =
            email;

    }


    if (editEmail) {

        editEmail.value =
            email;

    }


    // =================================================
    // INITIALS
    // =================================================

    if (topInitial) {

        topInitial.textContent =
            initial;

    }


    if (profileInitial) {

        profileInitial.textContent =
            initial;

    }


    if (completionInitial) {

        completionInitial.textContent =
            initial;

    }


    // =================================================
    // PROFILE DETAILS
    // =================================================

    if (institutionValue) {

        institutionValue.textContent =
            currentAcademicianData.institution ||
            "Not added";

    }


    if (departmentValue) {

        departmentValue.textContent =
            currentAcademicianData.department ||
            "Not added";

    }


    if (designationValue) {

        designationValue.textContent =
            currentAcademicianData.designation ||
            "Not added";

    }


    if (qualificationValue) {

        qualificationValue.textContent =
            currentAcademicianData.qualification ||
            "Not added";

    }


    if (experienceValue) {

        experienceValue.textContent =
            currentAcademicianData.experience
                ? `${currentAcademicianData.experience} years`
                : "Not added";

    }


    if (specializationValue) {

        specializationValue.textContent =
            currentAcademicianData.specialization ||
            "Not added";

    }


    if (locationValue) {

        locationValue.textContent =
            currentAcademicianData.location ||
            "Not added";

    }


    // =================================================
    // FILL PROFILE MODAL
    // =================================================

    if (editName) {

        editName.value =
            name;

    }


    if (editInstitution) {

        editInstitution.value =
            currentAcademicianData.institution ||
            "";

    }


    if (editDepartment) {

        editDepartment.value =
            currentAcademicianData.department ||
            "";

    }


    if (editDesignation) {

        editDesignation.value =
            currentAcademicianData.designation ||
            "";

    }


    if (editQualification) {

        editQualification.value =
            currentAcademicianData.qualification ||
            "";

    }


    if (editExperience) {

        editExperience.value =
            currentAcademicianData.experience ||
            "";

    }


    if (editSpecialization) {

        editSpecialization.value =
            currentAcademicianData.specialization ||
            "";

    }


    if (editLocation) {

        editLocation.value =
            currentAcademicianData.location ||
            "";

    }


    if (editBio) {

        editBio.value =
            currentAcademicianData.bio ||
            "";

    }


    // =================================================
    // PROFILE COMPLETION
    // =================================================

    const completion =
        calculateProfileCompletion();


    if (completionPercent) {

        completionPercent.textContent =
            `${completion}%`;

    }


    if (profileScore) {

        profileScore.textContent =
            `${completion}%`;

    }


    if (profileProgress) {

        profileProgress.style.width =
            `${completion}%`;

    }


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


    if (researchProjects) {

        researchProjects.textContent =
            projects;

    }


    if (researchPartners) {

        researchPartners.textContent =
            partners;

    }


    if (researchStudents) {

        researchStudents.textContent =
            researchStudentsValue;

    }


    if (researchCount) {

        researchCount.textContent =
            projects;

    }


    // =================================================
    // STUDENTS
    // =================================================

    if (studentsCount) {

        studentsCount.textContent =
            currentAcademicianData.studentsMentored ||
            0;

    }


    // =================================================
    // OPPORTUNITIES
    // =================================================

    if (opportunitiesCount) {

        opportunitiesCount.textContent =
            currentAcademicianData.opportunityCount ||
            0;

    }


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


    if (!skillsList) {

        return;

    }


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
                        : skill.name ||
                          "Skill";


                const level =
                    typeof skill === "object"
                        ? Number(
                            skill.level ||
                            70
                        )
                        : 70;


                const safeLevel =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            level
                        )
                    );


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
                                style="width:${safeLevel}%">
                            </div>

                        </div>


                        <strong>
                            ${safeLevel}%
                        </strong>

                    </div>

                `;

            }
        ).join("");

}


// =====================================================
// PROFILE PHOTO UPLOAD
// =====================================================

if (profilePhotoInput) {

    profilePhotoInput.addEventListener(
        "change",
        async () => {

            const file =
                profilePhotoInput.files[0];


            if (!file) {

                return;

            }


            // -------------------------------------------------
            // TYPE VALIDATION
            // -------------------------------------------------

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


            // -------------------------------------------------
            // SIZE VALIDATION
            // -------------------------------------------------

            const maxSize =
                5 *
                1024 *
                1024;


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


            // -------------------------------------------------
            // PHOTO BUTTON
            // -------------------------------------------------

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


            // -------------------------------------------------
            // LOCAL PREVIEW
            // -------------------------------------------------

            const localURL =
                URL.createObjectURL(
                    file
                );


            setProfileImage(
                localURL
            );


            try {

                // -------------------------------------------------
                // FORM DATA
                // -------------------------------------------------

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


                // -------------------------------------------------
                // CLOUDINARY UPLOAD
                // -------------------------------------------------

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


                // -------------------------------------------------
                // SAVE IMAGE URL
                // -------------------------------------------------

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


                // -------------------------------------------------
                // LOCAL DATA
                // -------------------------------------------------

                currentUserData.photoURL =
                    imageURL;


                // -------------------------------------------------
                // UPDATE AUTH
                // -------------------------------------------------

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


                // -------------------------------------------------
                // UPDATE DISPLAY
                // -------------------------------------------------

                setProfileImage(
                    imageURL
                );


                updateDashboard();


                showMessage(
                    "Profile photo updated successfully.",
                    "success"
                );

            }

            catch (error) {

                console.error(
                    "Profile photo upload error:",
                    error
                );


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
                    "Unable to upload profile photo.",
                    "error"
                );

            }

            finally {

                profilePhotoInput.value =
                    "";

                URL.revokeObjectURL(
                    localURL
                );


                if (photoButton) {

                    photoButton.style.pointerEvents =
                        "";

                    photoButton.style.opacity =
                        "";

                }

            }

        }
    );

}


// =====================================================
// SET PROFILE IMAGE
// =====================================================

function setProfileImage(
    imageURL
) {

    if (profileImage) {

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

    }


    if (topProfileImage) {

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
                        ${escapeHTML(
                            getInitial(
                                currentUserData.name
                            )
                        )}
                    </span>

                    `;

            };


        topProfileImage.appendChild(
            topImage
        );

    }


    if (completionAvatar) {

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

}


// =====================================================
// SHOW PROFILE INITIAL
// =====================================================

function showProfileInitial(
    initial
) {

    if (profileImage) {

        profileImage.innerHTML =
            `

            <span id="profileInitial">
                ${escapeHTML(initial)}
            </span>

            `;

    }


    if (topProfileImage) {

        topProfileImage.innerHTML =
            `

            <span id="topInitial">
                ${escapeHTML(initial)}
            </span>

            `;

    }


    if (completionAvatar) {

        completionAvatar.innerHTML =
            `

            <span id="completionInitial">
                ${escapeHTML(initial)}
            </span>

            `;

    }

}


// =====================================================
// PROFILE SAVE
// =====================================================

if (profileForm) {

    profileForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (!currentUser) {

                showFormMessage(
                    "Authentication session not available.",
                    "error"
                );

                return;

            }


            const name =
                editName.value.trim();


            const institution =
                editInstitution.value.trim();


            const department =
                editDepartment.value.trim();


            const designation =
                editDesignation.value.trim();


            const qualification =
                editQualification.value.trim();


            const experience =
                editExperience.value.trim();


            const specialization =
                editSpecialization.value.trim();


            const location =
                editLocation.value.trim();


            const bio =
                editBio.value.trim();


            if (!name) {

                showFormMessage(
                    "Full name is required.",
                    "error"
                );

                editName.focus();

                return;

            }


            saveProfileButton.disabled =
                true;


            saveProfileButton.innerHTML =
                "Saving...";


            clearFormMessage();


            try {

                // =============================================
                // USERS
                // =============================================

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


                // =============================================
                // ACADEMICIAN
                // =============================================

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


                // =============================================
                // FIREBASE AUTH
                // =============================================

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


                // =============================================
                // LOCAL DATA
                // =============================================

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


                // =============================================
                // UI
                // =============================================

                updateDashboard();


                showFormMessage(
                    "Profile saved successfully.",
                    "success"
                );


                showMessage(
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


                showMessage(
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

}


// =====================================================
// OPEN PROFILE MODAL
// =====================================================

if (completeProfileButton) {

    completeProfileButton.addEventListener(
        "click",
        openProfileModal
    );

}


function openProfileModal() {

    if (!profileModal) {

        return;

    }


    updateDashboard();


    clearFormMessage();


    profileModal.classList.add(
        "show"
    );

}


// =====================================================
// CLOSE PROFILE MODAL
// =====================================================

if (closeModal) {

    closeModal.addEventListener(
        "click",
        closeProfileModal
    );

}


if (cancelModal) {

    cancelModal.addEventListener(
        "click",
        closeProfileModal
    );

}


function closeProfileModal() {

    if (!profileModal) {

        return;

    }


    profileModal.classList.remove(
        "show"
    );

}


// =====================================================
// CLICK OUTSIDE MODAL
// =====================================================

if (profileModal) {

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

}


// =====================================================
// FORM MESSAGE
// =====================================================

function showFormMessage(
    message,
    type
) {

    if (!profileSaveMessage) {

        return;

    }


    profileSaveMessage.textContent =
        message;


    profileSaveMessage.className =
        type
            ? `form-message ${type}`
            : "form-message";

}


function clearFormMessage() {

    showFormMessage(
        "",
        ""
    );

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


        element.style.maxWidth =
            "340px";


        element.style.lineHeight =
            "1.5";


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

                if (
                    element &&
                    element.parentNode
                ) {

                    element.remove();

                }

            },
            4000
        );

}


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                logoutBtn.disabled =
                    true;


                logoutBtn.textContent =
                    "Logging out...";


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


                logoutBtn.disabled =
                    false;


                logoutBtn.innerHTML =
                    `
                    <span>↪</span>
                    Logout
                    `;


                showMessage(
                    "Unable to logout. Please try again.",
                    "error"
                );

            }

        }
    );

}


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


// =====================================================
// CLOSE MOBILE SIDEBAR ON NAVIGATION
// =====================================================

document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    if (sidebar) {

                        sidebar.classList.remove(
                            "open"
                        );

                    }

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

    switch (
        role
    ) {

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

    if (
        !name ||
        !String(name).trim()
    ) {

        return "A";

    }


    return String(name)
        .trim()
        .charAt(0)
        .toUpperCase();

}


function firstName(
    name
) {

    if (
        !name ||
        !String(name).trim()
    ) {

        return "Academician";

    }


    return String(name)
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