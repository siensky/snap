import { useState } from "react";
import { View, StyleSheet, Pressable, Text, TextInput } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

type PhotoPreviewProps = {
  photoUri: string;
  discard: () => void;
};

function PhotoPreview({ photoUri, discard }: PhotoPreviewProps) {
  const [caption, setCaption] = useState("");

  return (
    <View style={styles.container}>
      <Image
        source={photoUri}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      <SafeAreaView style={styles.controls}>
        <Pressable onPress={discard}>
          <Text style={styles.discard}>X</Text>
        </Pressable>
      </SafeAreaView>

      <SafeAreaView style={styles.bottomBar}>
        <TextInput
          style={styles.captionInput}
          placeholder="Add a caption"
          placeholderTextColor="#eee"
          value={caption}
          onChangeText={setCaption}
        />
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/select-recipients",
              params: { photoUri, caption },
            })
          }
        >
          <Text style={styles.send}>Skicka</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: {
    ...StyleSheet.absoluteFill,
    alignItems: "flex-start",
    padding: 16,
  },
  discard: { fontSize: 48 },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  captionInput: {
    flex: 1,
    color: "white",
    fontSize: 18,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  send: { fontSize: 24, fontWeight: "bold", color: "white" },
});

export default PhotoPreview;
