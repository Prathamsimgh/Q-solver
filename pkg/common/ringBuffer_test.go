package common

import (
	"bytes"
	"errors"
	"testing"
)

func TestNewRingBufferDefaultsCapacity(t *testing.T) {
	rb := NewRingBuffer(0)
	if rb == nil || rb.Len() != 0 {
		t.Fatalf("expected empty buffer, got len=%d", rb.Len())
	}
	n, err := rb.Write(bytes.Repeat([]byte("x"), 4096))
	if err != nil || n != 4096 || rb.Len() != 4096 {
		t.Fatalf("expected full 4096-byte buffer, got n=%d len=%d err=%v", n, rb.Len(), err)
	}
}

func TestRingBufferWriteReadRoundTrip(t *testing.T) {
	rb := NewRingBuffer(16)
	if _, err := rb.Write([]byte("hello world")); err != nil {
		t.Fatal(err)
	}
	buf := make([]byte, 11)
	if _, err := rb.Read(buf); err != nil {
		t.Fatal(err)
	}
	if string(buf) != "hello world" {
		t.Fatalf("got %q, want %q", buf, "hello world")
	}
	if rb.Len() != 0 {
		t.Fatalf("expected empty buffer after full read, got len=%d", rb.Len())
	}
}

func TestRingBufferWrapAroundKeepsLatest(t *testing.T) {
	rb := NewRingBuffer(8)
	if _, err := rb.Write([]byte("0123456789abcdef")); err != nil { // 16 bytes, cap 8
		t.Fatal(err)
	}
	buf := make([]byte, 8)
	if _, err := rb.Read(buf); err != nil {
		t.Fatal(err)
	}
	if string(buf) != "89abcdef" {
		t.Fatalf("got %q, want latest 8 bytes %q", buf, "89abcdef")
	}
}

func TestRingBufferReadNotEnoughData(t *testing.T) {
	rb := NewRingBuffer(16)
	if _, err := rb.Write([]byte("abc")); err != nil {
		t.Fatal(err)
	}
	if _, err := rb.Read(make([]byte, 4)); !errors.Is(err, ErrNotEnoughData) {
		t.Fatalf("expected ErrNotEnoughData, got %v", err)
	}
	if _, err := rb.Read(make([]byte, 0)); err != nil {
		t.Fatalf("empty read should succeed, got %v", err)
	}
}

func TestRingBufferReset(t *testing.T) {
	rb := NewRingBuffer(16)
	if _, err := rb.Write([]byte("data")); err != nil {
		t.Fatal(err)
	}
	rb.Reset()
	if rb.Len() != 0 {
		t.Fatalf("expected len 0 after reset, got %d", rb.Len())
	}
	if _, err := rb.Write([]byte("again")); err != nil {
		t.Fatal(err)
	}
	buf := make([]byte, 5)
	if _, err := rb.Read(buf); err != nil || string(buf) != "again" {
		t.Fatalf("got %q err=%v, want %q", buf, err, "again")
	}
}
