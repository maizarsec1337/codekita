"""Remove the connected navy canvas from CodeKita's three academy PNGs."""

from pathlib import Path
import struct
import zlib


ASSETS = Path(__file__).parent


def decode_png(path: Path):
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Not a PNG: {path}")

    position = 8
    compressed = []
    while position < len(data):
        size = struct.unpack(">I", data[position : position + 4])[0]
        kind = data[position + 4 : position + 8]
        chunk = data[position + 8 : position + 8 + size]
        position += size + 12
        if kind == b"IHDR":
            width, height, depth, color, _, _, interlace = struct.unpack(
                ">IIBBBBB", chunk
            )
        elif kind == b"IDAT":
            compressed.append(chunk)
        elif kind == b"IEND":
            break

    if depth != 8 or color not in (2, 6) or interlace != 0:
        raise ValueError("Expected a non-interlaced, 8-bit RGB or RGBA PNG")

    channels = 3 if color == 2 else 4
    stride = width * channels
    raw = zlib.decompress(b"".join(compressed))
    rows = []
    previous = bytearray(stride)
    offset = 0
    for _ in range(height):
        filter_type = raw[offset]
        offset += 1
        row = bytearray(raw[offset : offset + stride])
        offset += stride
        for index in range(stride):
            left = row[index - channels] if index >= channels else 0
            up = previous[index]
            upper_left = previous[index - channels] if index >= channels else 0
            if filter_type == 1:
                row[index] = (row[index] + left) & 255
            elif filter_type == 2:
                row[index] = (row[index] + up) & 255
            elif filter_type == 3:
                row[index] = (row[index] + (left + up) // 2) & 255
            elif filter_type == 4:
                estimate = left + up - upper_left
                distances = (
                    abs(estimate - left),
                    abs(estimate - up),
                    abs(estimate - upper_left),
                )
                predictor = (
                    left
                    if distances[0] <= distances[1] and distances[0] <= distances[2]
                    else up
                    if distances[1] <= distances[2]
                    else upper_left
                )
                row[index] = (row[index] + predictor) & 255
            elif filter_type != 0:
                raise ValueError(f"Unsupported PNG filter: {filter_type}")
        rows.append(row)
        previous = row

    return width, height, channels, rows


def write_rgba_png(path: Path, width: int, height: int, pixels: bytearray):
    def chunk(kind: bytes, payload: bytes):
        return (
            struct.pack(">I", len(payload))
            + kind
            + payload
            + struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF)
        )

    raw = b"".join(
        b"\0" + pixels[y * width * 4 : (y + 1) * width * 4]
        for y in range(height)
    )
    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def remove_connected_background(source: Path, destination: Path):
    width, height, channels, rows = decode_png(source)
    border = []
    for x in range(width):
        border.extend(
            (
                tuple(rows[0][x * channels : x * channels + 3]),
                tuple(rows[-1][x * channels : x * channels + 3]),
            )
        )
    for y in range(1, height - 1):
        border.extend(
            (
                tuple(rows[y][:3]),
                tuple(rows[y][width * channels - 3 : width * channels]),
            )
        )
    background = tuple(
        sorted(pixel[channel] for pixel in border)[len(border) // 2]
        for channel in range(3)
    )

    count = width * height
    visited = bytearray(count)
    queue = []

    def color_at(index: int):
        x, y = index % width, index // width
        offset = x * channels
        return tuple(rows[y][offset : offset + 3])

    def distance(index: int):
        return max(abs(color_at(index)[channel] - background[channel]) for channel in range(3))

    def enqueue(index: int):
        if not visited[index] and distance(index) <= 9:
            visited[index] = 1
            queue.append(index)

    for x in range(width):
        enqueue(x)
        enqueue((height - 1) * width + x)
    for y in range(1, height - 1):
        enqueue(y * width)
        enqueue(y * width + width - 1)

    head = 0
    while head < len(queue):
        index = queue[head]
        head += 1
        x, y = index % width, index // width
        if x:
            enqueue(index - 1)
        if x + 1 < width:
            enqueue(index + 1)
        if y:
            enqueue(index - width)
        if y + 1 < height:
            enqueue(index + width)

    pixels = bytearray(count * 4)
    for index in range(count):
        x, y = index % width, index // width
        source_offset = x * channels
        target_offset = index * 4
        pixels[target_offset : target_offset + 3] = bytes(color_at(index))
        source_alpha = rows[y][source_offset + 3] if channels == 4 else 255
        alpha = 0 if visited[index] else source_alpha
        touches_background = (
            (x > 0 and visited[index - 1])
            or (x + 1 < width and visited[index + 1])
            or (y > 0 and visited[index - width])
            or (y + 1 < height and visited[index + width])
        )
        if not visited[index] and touches_background:
            matte_distance = distance(index)
            if matte_distance <= 70:
                edge_alpha = min(1.0, max(0.0, (matte_distance - 1) / 35))
                alpha = min(source_alpha, round(edge_alpha * 255))
        pixels[target_offset + 3] = alpha

    write_rgba_png(destination, width, height, pixels)
    print(
        f"{source.name}: background RGB {background}, "
        f"removed {sum(visited)}/{count} connected canvas pixels; "
        f"wrote {destination.name} ({destination.stat().st_size} bytes)"
    )


if __name__ == "__main__":
    for name in ("desain4", "desain5", "desain6"):
        source = ASSETS / f"{name}.png"
        destination = ASSETS / f"{name}-transparent.png"
        remove_connected_background(source, destination)