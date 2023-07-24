import { useEffect, useState } from 'react';
import { Text, View, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

import { ScreenHeaderBtn, FriendCard } from '../../components';
import { COLORS, icons } from '../../constants';
import styles from "./friends.style";
import useFetch from '../../hook/useFetch';


const filterUsersByFriendship = (friends, users, post) => {
  const userIds = friends.reduce((acc, friend) => {
    acc.add(friend.user1Id);
    acc.add(friend.user2Id);
    return acc;
  }, new Set());

  /*
   todo still includes the logged in user 
   */
  return users.filter((user) => user.userId !== post && userIds.has(user.userId));
};





const Friends = () => {
  const { post } = useLocalSearchParams();

  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [friends, setFriends] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [noUsersFound, setNoUsersFound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const user1Id = post;
  const [user2Id, setUser2Id] = useState("");
  const error = false;


  const filterUsersByName = () => {
    if (!searchTerm) {
      setFilteredUsers([]); // If search term is empty, clear the filteredUsers list
      setSearchedUsers([]); // Clear the searchedUsers list
      setNoUsersFound(false);
      return;
    }
  
    const searched = users.filter((user) => {
      return user.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  
    setSearchedUsers(searched);

    // Check if there are no users found after searching
    if (searched.length === 0) {
      setNoUsersFound(true); 
    } else {
      setNoUsersFound(false);
  }
  };

    // Function to handle adding a friend
    const addFriend = (friendUserId) => {

      const friendship = { user1Id: post, user2Id: friendUserId };

      console.log("post" + post)
      console.log("frienduserid" + friendUserId)
      console.log("friendship" + friendship)

      // add the friendship to the database
      fetch('http://localhost:8080/api/v1/friendship', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(friendship),
      })

        .catch((error) => {
          // Handle any errors
          console.error('Error adding friend:', error);
        });
    };

  const fetchFriends = () => {
    fetch(`http://localhost:8080/api/v1/friendship?userId=${post}`)
    .then(res => res.json())
    .then((result) => {
      setFriends(result);
    })
  };

  const fetchUsers = () => {
    fetch(`http://localhost:8080/api/v1/user`)
    .then(res => res.json())
    .then((result) => {
      setUsers(result);
    })
  };

    // gets habit data from the database
    useEffect(() => {
        fetchFriends();
        fetchUsers();
      },[ post ])

    useEffect(() => {
      // Filter users whenever friends or users change
      const filtered = filterUsersByFriendship(friends, users, post);
      filterUsersByName();
      setFilteredUsers(filtered);

    }, [friends, users, post, searchTerm]);


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.lightWhite }}>
            <Stack.Screen 
                options={{ 
                    headerStyle: { backgroundColor: COLORS.lightWhite },
                    headerShadowVisible: false,
                    headerTitle: "",
                    headerLeft: () => (
                    <ScreenHeaderBtn 
                        icon={icons.left}
                        dimension={"70%"}
                        handlePress={() => router.back()}
                    />
                ),
                }}
            />

            <>
             
                 <View style={styles.pageContainer}>
                  <View style={styles.container}>
                    <Text style={styles.title}>Friends</Text>
                  </View>

                  <View>
                    <View>
                      <Text style={styles.fieldName}>Add friend</Text>
                    </View>
                    
                    <View style={styles.searchContainer}>
                      <View style={styles.searchWrapper}>
                        <TextInput
                          style={styles.searchInput}
                          value={searchTerm}
                          onChangeText={(text) => setSearchTerm(text)}
                          placeholder='Search...'
                        />
                      </View>

                      <TouchableOpacity 
                        style={styles.searchBtn} 
                        onPress={() => {
                            filterUsersByName();
                          }}
                        >
                        <Image
                          source={icons.search}
                          resizeMode='contain'
                          style={styles.searchBtnImage}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                
                  <View>
                  <View style={styles.friendContainer}>
                      <ScrollView showsVerticalScrollIndicator={false} style={styles.friendSearch}>
                      
                        {// renders users found with the searched name
                          noUsersFound ? (
                        <Text style={styles.text}>No users found</Text>
                      ) : (

                        searchedUsers.map((item) => (
                          <FriendCard
                            key={item.userId}
                            friend={item}
                            handlePress={() => addFriend(item.userId)}
                            add={true}
                          />
                        ))
                      )}
                    </ScrollView>
                  </View>
                </View>

                <View>
                  <View style={styles.friendContainer}>
                    <View>
                      <Text style={styles.fieldName}>Friends list</Text>
                    </View>
                      <ScrollView showsVerticalScrollIndicator={false}>
                    {refreshing ? (
                        <ActivityIndicator size="large" color={COLORS.primary} />

                        // checks for any errors 
                    ) : error ? (
                        <Text style={styles.text}>Something went wrong</Text>

                        // renders placeholder if friends is empty 
                    ) : friends.length === 0 ? (
                        <Text style={styles.text}>Search for friends to track habits together!</Text>
                    ) : (

                        // renders the FriendCard component for each habit 
                        filteredUsers.map((item) => (
                        <FriendCard 
                            key={item.userId}
                            friend={item}
                            handlePress={() => router.push({pathname: `/friendship/${item.userId}`, params: { post: item.userId } })} 
                            add={false}
                        />
                        )))}
                    </ScrollView>
                  </View>
                </View>
              
              </View>
            </>
    </SafeAreaView>
  )
}

export default Friends;