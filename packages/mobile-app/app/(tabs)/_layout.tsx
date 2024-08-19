import { FontAwesome6, Ionicons, FontAwesome } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useState } from "react";
import { Button, Modal, SafeAreaView, Text } from "react-native";
import { LinkButton } from "../../components/LinkButton";

export default function Layout() {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Modal animationType="slide" visible={modalVisible}>
        <SafeAreaView style={{ flex: 1 }}>
          <Text>Transact</Text>
          <LinkButton
            title="Receive"
            href="/address/"
            onPress={() => setModalVisible(false)}
          />
          <Text>Receive assets from another wallet</Text>
          <LinkButton
            title="Send"
            href="/send/"
            onPress={() => setModalVisible(false)}
          />
          <Text>Send assets to another wallet</Text>
          <Button title="Close" onPress={() => setModalVisible(false)} />
        </SafeAreaView>
      </Modal>
      <Tabs>
        <Tabs.Screen
          name="index"
          options={{
            title: "Balances",
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? "wallet" : "wallet-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="transact"
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setModalVisible(!modalVisible);
            },
          }}
          options={{
            title: "Transact",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome6
                name="arrow-right-arrow-left"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="contacts"
          options={{
            title: "Contacts",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="user-circle-o" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="ui"
          options={{
            title: "UI Kit",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="paint-brush" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
