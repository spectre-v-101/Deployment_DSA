CXX      = g++
CXXFLAGS = -std=c++17 -O2 -Wall

SRCS     = server.cpp search.cpp similarity.cpp trie.cpp
TARGET   = server

all: $(TARGET)

$(TARGET): $(SRCS)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SRCS)

clean:
	rm -f $(TARGET)
