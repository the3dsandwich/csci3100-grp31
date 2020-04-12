import { firestore, auth, storage } from "firebase";

// sets up database for new account
// should be called upon login, and when user data does not exist
export const setupFirestoreForNewAccount = async ({ uid }) => {
  const accountData = {
    uid,
    username: "Lil Potato",
    university: "",
    interested_sports: "",
    description: "",
  };
  const userDataRef = firestore().collection("user_profile").doc(uid);
  await userDataRef.set(accountData);
};

// sets up database for new event given event data
// it will then automatically add current user to the event
// by calling addParticipantToEvent() with status "joined"
// it will also automatically create event chat
// by calling setupFirestoreForNewEventChat()
export const setupFirestoreForNewEvent = async ({
  allowedPeople,
  eventName,
  eventType,
  isPublic,
  location,
  startingTime,
}) => {
  if (
    auth().currentUser &&
    allowedPeople &&
    eventName &&
    eventType &&
    isPublic &&
    location &&
    startingTime
  ) {
    const { uid } = auth().currentUser;
    const eventRef = firestore().collection("event");
    const eventData = {
      allowedPeople,
      eventName: eventName.trim(),
      eventType: eventType.trim(),
      isPublic,
      location: location.trim(),
      startingTime,
      hostUid: uid,
    };
    const eventDataRef = await eventRef.add(eventData);
    // automatically calls addParticipantToEvent() with status "joined"
    await addParticipantToEvent({
      eid: eventDataRef.id,
      uid,
      status: "joined",
    });
    // automatically calls setupFirestoreForNewEventChat()
    const { cid } = await setupFirestoreForNewEventChat({
      eid: eventDataRef.id,
      eventName,
    });
    eventDataRef.update({ cid, eid: eventDataRef.id });
  }
};

// sets up database for new event chat given event data
// it will then automatically add current user to the event chat
// by calling addParticipantToChat()
export const setupFirestoreForNewEventChat = async ({ eid, eventName }) => {
  if (auth().currentUser && eid && eventName) {
    const { uid } = auth().currentUser;
    const userDataRef = firestore().collection("user_profile").doc(uid);
    const userDataSnap = await userDataRef.get();
    const eventDataRef = firestore().collection("event").doc(eid);
    const eventDataSnap = await eventDataRef.get();
    const { eventType } = eventDataSnap.data();
    const eventTypeRef = firestore()
      .collection("event_types")
      .where("value", "==", eventType);
    const eventTypeSnap = await eventTypeRef.get();
    let icon = "fab fa-dev";
    eventTypeSnap.forEach((d) => (icon = d.data().icon));
    if (userDataSnap.exists) {
      const chatData = {
        type: "event",
        title: eventName,
        eid,
        icon,
      };
      const chatDataRef = await firestore().collection("chat").add(chatData);
      await chatDataRef.update({
        cid: chatDataRef.id,
      });
      // automatically calls addParticipantToChat() to add current user
      await addParticipantToChat({ cid: chatDataRef.id, uid });
      return { cid: chatDataRef.id };
    }
  }
};

// adds participant to chat provided chat id and user id
// will check if chat and user data exists
export const addParticipantToChat = async ({ cid, uid }) => {
  if (auth().currentUser && cid && uid) {
    const chatDataRef = firestore().collection("chat").doc(cid);
    const userDataRef = firestore().collection("user_profile").doc(uid);
    const chatDataSnap = await chatDataRef.get();
    const userDataSnap = await userDataRef.get();
    if (chatDataSnap.exists && userDataSnap.exists) {
      const { username, uid } = userDataSnap.data();
      await chatDataRef
        .collection("participants")
        .doc(uid)
        .set({ username, uid });
      await userDataRef
        .collection("chats")
        .doc(cid)
        .set({ cid, ...chatDataSnap.data() });
    }
  }
};

// adds participant to event provided event id, user id
// and status ("joined" or "interested")
// will check if event and user data exists
// automatically participant to chat (for now)
export const addParticipantToEvent = async ({ eid, uid, status }) => {
  if (auth().currentUser && eid && uid && status) {
    const eventDataRef = firestore().collection("event").doc(eid);
    const userDataRef = firestore().collection("user_profile").doc(uid);
    const eventDataSnap = await eventDataRef.get();
    const userDataSnap = await userDataRef.get();
    if (eventDataSnap.exists && userDataSnap.exists) {
      const { username, uid } = userDataSnap.data();
      const { cid } = eventDataSnap.data();
      await eventDataRef
        .collection("participants")
        .doc(uid)
        .set({ username, uid, status });
      await userDataRef
        .collection("events")
        .doc(eid)
        .set({ eid, status, ...eventDataSnap.data() });
      await addParticipantToChat({ cid, uid });
    }
  }
};

// sends friend request and writes friend data in sent_friend_request of user,
// writes user data in received_friend_request of target
// this now makes sure request is sent only once
export const sendFriendRequest = async ({ targetUid }) => {
  if (auth().currentUser && targetUid) {
    const { uid } = auth().currentUser;
    const userDataRef = firestore().collection("user_profile").doc(uid);
    const targetDataRef = firestore().collection("user_profile").doc(targetUid);
    const userDataSnap = await userDataRef.get();
    const targetDataSnap = await targetDataRef.get();
    if (userDataSnap.exists && targetDataSnap.exists) {
      const friendRequestSnap = await userDataRef
        .collection("sent_friend_requests")
        .doc(targetUid)
        .get();
      if (!friendRequestSnap.exists) {
        const time = Date.now();
        {
          const { username, uid } = targetDataSnap.data();
          await userDataRef
            .collection("sent_friend_requests")
            .doc(targetUid)
            .set({ username, uid, time });
        }
        {
          const { username, uid } = userDataSnap.data();
          await targetDataRef
            .collection("received_friend_requests")
            .doc(uid)
            .set({ username, uid, time });
        }
      }
    }
  }
};

// accepts friend request and moves user data from request to friend_list
export const acceptFriendRequest = async ({ targetUid }) => {
  if (auth().currentUser && targetUid) {
    const { uid } = auth().currentUser;
    const userDataRef = firestore().collection("user_profile").doc(uid);
    const targetDataRef = firestore().collection("user_profile").doc(targetUid);
    const userDataSnap = await userDataRef.get();
    const targetDataSnap = await targetDataRef.get();
    if (userDataSnap.exists && targetDataSnap.exists) {
      const time = Date.now();
      {
        const { username, uid } = targetDataSnap.data();
        const friendRequestRef = userDataRef
          .collection("received_friend_requests")
          .doc(targetUid);
        const friendRequestSnap = await friendRequestRef.get();
        if (friendRequestSnap.exists) {
          await friendRequestRef.delete();
          await userDataRef
            .collection("friend_list")
            .doc(targetUid)
            .set({ username, uid, time });
        }
      }
      {
        const { username, uid } = userDataSnap.data();
        const friendRequestRef = targetDataRef
          .collection("sent_friend_requests")
          .doc(uid);
        const friendRequestSnap = await friendRequestRef.get();
        if (friendRequestSnap.exists) {
          await friendRequestRef.delete();
          await targetDataRef
            .collection("friend_list")
            .doc(uid)
            .set({ username, uid, time });
        }
      }
    }
  }
};

// takes back friend request
export const removeFriendRequest = async ({ targetUid }) => {
  if (auth().currentUser && targetUid) {
    const { uid } = auth().currentUser;
    const userDataRef = firestore().collection("user_profile").doc(uid);
    const targetDataRef = firestore().collection("user_profile").doc(targetUid);
    const userDataSnap = await userDataRef.get();
    const targetDataSnap = await targetDataRef.get();
    if (userDataSnap.exists && targetDataSnap.exists) {
      {
        const friendRequestRef = userDataRef
          .collection("sent_friend_requests")
          .doc(targetUid);
        const friendRequestSnap = await friendRequestRef.get();
        if (friendRequestSnap.exists) {
          await friendRequestRef.delete();
        }
      }
      {
        const { uid } = userDataSnap.data();
        const friendRequestRef = targetDataRef
          .collection("received_friend_requests")
          .doc(uid);
        const friendRequestSnap = await friendRequestRef.get();
        if (friendRequestSnap.exists) {
          await friendRequestRef.delete();
        }
      }
    }
  }
};

// unfriends friend by removing use and target from friend_list
export const unfriendFriend = async ({ targetUid }) => {
  if (auth().currentUser && targetUid) {
    const { uid } = auth().currentUser;
    const userDataRef = firestore().collection("user_profile").doc(uid);
    const targetDataRef = firestore().collection("user_profile").doc(targetUid);
    const userDataSnap = await userDataRef.get();
    const targetDataSnap = await targetDataRef.get();
    if (userDataSnap.exists && targetDataSnap.exists) {
      await userDataRef.collection("friend_list").doc(targetUid).delete();
      await targetDataRef.collection("friend_list").doc(uid).delete();
    }
  }
};

// updates profile data given profileData
// only updates if profileData belongs to current user
// no verification on data types yet
export const updateProfileData = async ({ profileData }) => {
  if (
    auth().currentUser &&
    profileData &&
    profileData.uid === auth().currentUser.uid
  ) {
    const { uid } = auth().currentUser;
    const userDataRef = firestore().collection("user_profile").doc(uid);
    const userDataSnap = await userDataRef.get();
    if (userDataSnap.exists) {
      await userDataRef.update(profileData);
    }
  }
};

// uploads profile image to firebase storage
// requires imageFile from <input type="file"/>
// and setUploadProgress() from useState
// will then update profile data for profileImageSrc
export const uploadProfileImage = async ({ imageFile, setUploadProgress }) => {
  if (auth().currentUser && imageFile) {
    const { uid } = auth().currentUser;
    const storageRef = storage()
      .ref("profile_image")
      .child(uid + imageFile.name);
    const uploadTask = storageRef.put(imageFile);
    const progress = (snap) =>
      setUploadProgress(100 * (snap.bytesTransferred / snap.totalBytes));
    const error = (e) => console.log(e.message);
    const complete = async () => {
      const profileImageSrc = await (await uploadTask).ref.getDownloadURL();
      await firestore()
        .collection("user_profile")
        .doc(uid)
        .update({ profileImageSrc });
      console.log("Uploaded profile image, available at", profileImageSrc);
    };
    uploadTask.on("state_changed", progress, error, complete);
  }
};

export const sendChatMessage = async ({
  cid,
  inputMessage,
  chatParticipants,
}) => {
  if (inputMessage.length > 0 && auth().currentUser) {
    const { uid } = auth().currentUser;
    const storedUserData = chatParticipants.find((p) => p.uid === uid);
    if (storedUserData) {
      const toSend = {
        text: inputMessage.trim(),
        created_at: Date.now(),
        sender: { uid },
      };
      firestore()
        .collection("chat")
        .doc(cid)
        .collection("messages")
        .add(toSend);
    }
  }
};
